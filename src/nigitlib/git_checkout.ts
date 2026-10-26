import { CmdUtils } from './cmd_utils';
import { GitForAll } from './git_forall';
import { GitProject } from './git_config';
import colors from 'colors';
import fs from 'fs';
import { TablePrinter } from './table-printer';

/**
 * Tags of this project look like 'v1.2.3' or 'v1.2.3-rc0'. A name in that
 * form has to be a tag, see GitCheckout._resolveRef().
 */
const TAG_NAME_PATTERN = /^v\d+\.\d+\.\d+/;

function refExists(projDir: string, ref: string): boolean {
    return CmdUtils.exec(`cd ${projDir} && git rev-parse -q --verify ${ref}`).exitCode == 0;
}

/**
 * Refs pointing at HEAD, in the order they are tried when naming a detached
 * HEAD: the branch that was checked out first, then local and remote branches,
 * and tags as the last resort.
 */
function orderRefsPointingAtHead(
    refs: string[],
    preferredBranch: string | undefined
): string[] {
    const order: string[] = [];
    if (preferredBranch != undefined) {
        order.push(`refs/heads/${preferredBranch}`);
        order.push(`refs/remotes/origin/${preferredBranch}`);
    }
    order.push(...refs.filter((ref) => ref.startsWith('refs/heads/')));
    order.push(...refs.filter((ref) => ref.startsWith('refs/remotes/origin/')));
    order.push(...refs.filter((ref) => ref.startsWith('refs/tags/')));

    // origin/HEAD is a symbolic ref to the default branch, it names nothing
    return order.filter(
        (ref) => ref != 'refs/remotes/origin/HEAD' && refs.indexOf(ref) != -1
    );
}

function toShortRefName(ref: string): string {
    for (const prefix of ['refs/heads/', 'refs/remotes/', 'refs/tags/']) {
        if (ref.startsWith(prefix)) {
            return ref.substring(prefix.length);
        }
    }

    return ref;
}

/**
 * Name HEAD the same way for every project. 'git branch' describes a detached
 * HEAD with whichever ref happens to point at the commit, falling back to a
 * bare object name, so a single column mixes 'origin/branches/2.13.x' with
 * '42a7030'. Resolve the name here instead, preferring the branch that was
 * checked out.
 */
export function getCurrentBranch(
    projDir: string,
    preferredBranch?: string
): string | null {
    const attached = CmdUtils.exec(
        `cd ${projDir} && git symbolic-ref --quiet --short HEAD`
    );
    if (attached.exitCode == 0) {
        return attached.stdout.trim();
    }

    const pointsAt = CmdUtils.exec(
        `cd ${projDir} && git for-each-ref --points-at HEAD --format='%(refname)'`
    );
    if (pointsAt.exitCode == 0) {
        const refs = pointsAt.stdout.split(/\r?\n/).filter((ref) => ref.length > 0);
        const names = orderRefsPointingAtHead(refs, preferredBranch);
        if (names.length > 0) {
            return toShortRefName(names[0]);
        }
    }

    const head = CmdUtils.exec(`cd ${projDir} && git rev-parse --short HEAD`);
    if (head.exitCode == 0) {
        return `(detached at ${head.stdout.trim()})`;
    }

    return null;
}

function getBranchMessage(currentBranch: string, message: string | undefined) {
    if (message == undefined) {
        return `* ${currentBranch}`;
    } else {
        return `* ${currentBranch} ` + colors.grey(message);
    }
}

function getBranchWarning(currentBranch: string, missingBranch: string) {
    return (
        colors.yellow(`* ${currentBranch} `) +
        colors.grey(`(Cannot find '${missingBranch}')`)
    );
}

export class GitCheckoutOptions {
    force?: boolean;
    noLocal?: boolean;
}

class ProjectCheckoutResult {
    succ = false;
    message?: string;
}

export class GitCheckout {
    private branchName!: string;
    private options: GitCheckoutOptions = { force: false };
    private mainProjectBranch!: string;

    setOptions(options: GitCheckoutOptions) {
        this.options = options;
    }

    /**
     * Checkout to branch
     */
    cmdCheckout(branchName: string, options: GitCheckoutOptions): number {
        let forall = GitForAll.instance('.');
        const table = forall.newTablePrinter();
        table.printHeader('Project', 'Branches');

        this.branchName = branchName;
        this.options = options;

        // checkout main project first
        try {
            this.mainProjectBranch = this._checkoutMainProject(
                forall.mainProject,
                table
            );
        } catch (error) {
            table.printHeader('Project', 'Branches');
            table.firstColumnWidth = forall.mainProject.name.length + 2;
            table.printLine(forall.mainProject.name, colors.red(error.message));
            return 1;
        }

        // reload forall
        forall = GitForAll.instance('.');

        let exitCode = 0;
        for (const proj of forall.subprojects) {
            if (!this._checkoutSubproject(table, proj)) {
                exitCode = 1;
            }
        }

        return exitCode;
    }

    private _checkoutMainProject(proj: GitProject, table: TablePrinter): string {
        const projDir = proj.directory;
        // checkout
        const coResult = this._checkout(projDir, this.branchName);

        // get current branch
        const mainProjectBranch = getCurrentBranch(projDir, this.branchName);
        if (mainProjectBranch == undefined) {
            throw new Error(
                `Failed to get the branch name of main project '${proj.name}'`
            );
        }

        if (coResult.succ) {
            table.printLine(
                proj.name,
                getBranchMessage(mainProjectBranch, coResult.message)
            );
        } else {
            table.printLine(
                proj.name,
                getBranchWarning(mainProjectBranch, this.branchName)
            );
        }

        return mainProjectBranch;
    }

    private _checkoutSubproject(table: TablePrinter, proj: GitProject): boolean {
        try {
            const projDir: string = proj.directory;

            if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
                return true;
            }

            if (!proj.isGitRepository()) {
                table.printLine(proj.name, colors.grey('(not a git repository)'));
                return true;
            }

            // checkout to specified branch
            const coResult = this._checkout(projDir, this.branchName);
            if (!coResult.succ) {
                // if failed, checkout to the main project branch
                this._checkout(projDir, this.mainProjectBranch);
            }

            const branch = getCurrentBranch(projDir, this.branchName);
            if (coResult.succ) {
                table.printLine(
                    proj.name,
                    getBranchMessage(branch!, coResult.message)
                );
            } else {
                table.printLine(proj.name, getBranchWarning(branch!, this.branchName));
            }

            return true;
        } catch (error) {
            const messages: string[] = error.message.split(/\r?\n/);
            table.printLines(
                proj.name,
                messages.map((s) => colors.red(s))
            );
            return false;
        }
    }

    /**
     * Resolve NAME to a full ref, so that 'git checkout' never falls back to
     * its DWIM branch creation. Returns undefined if nothing matches.
     *
     * A name in tag form ('v1.2.3') must resolve to a tag. Finding a branch
     * with that name means the repository is broken, so we fail loudly instead
     * of silently building the wrong revision.
     */
    private _resolveRef(projDir: string, name: string): string | undefined {
        // the fallback path of _checkoutSubproject() re-enters with a resolved
        // ref. A plain branch name like 'branches/2.13.x' must not be taken for
        // one: git resolves it to a local branch, which is left behind by an
        // earlier checkout and may be many commits behind the remote.
        if (name.startsWith('refs/') || name.startsWith('origin/')) {
            return refExists(projDir, name) ? name : undefined;
        }

        if (TAG_NAME_PATTERN.test(name)) {
            if (refExists(projDir, `refs/tags/${name}`)) {
                return `refs/tags/${name}`;
            }
            if (
                refExists(projDir, `refs/remotes/origin/${name}`) ||
                refExists(projDir, `refs/heads/${name}`)
            ) {
                throw new Error(`'${name}' looks like a tag, but it is a branch`);
            }
        } else if (refExists(projDir, `refs/remotes/origin/${name}`)) {
            return `origin/${name}`;
        }

        return undefined;
    }

    _checkout(projDir: string, branchName: string): ProjectCheckoutResult {
        // '--detach' is required, otherwise git creates a local branch for a
        // remote branch, and DWIM can even prefer a branch over a tag
        const args: string[] = [];
        let target = branchName;
        if (this.options.noLocal) {
            const ref = this._resolveRef(projDir, branchName);
            if (ref == undefined) {
                return { succ: false };
            }
            target = ref;
            args.push('--detach');
        }
        if (this.options.force) {
            args.push('--force');
        }

        const cmd = `cd ${projDir} && git checkout ${target} ${args.join(' ')}`;
        const result = CmdUtils.exec(cmd);
        if (result.exitCode == 0) {
            let message;
            let m;
            // tslint:disable-next-line: no-conditional-assignment
            if (
                (m = result.stdout.match(
                    /Your branch is behind '.*' by \d+ commits, and can be fast-forwarded/m
                ))
            ) {
                message = m[0];
                // tslint:disable-next-line: no-conditional-assignment
            } else if (
                (m = result.stdout.match(/Your branch and '.*' have diverged/m))
            ) {
                message = m[0];
            }
            return { succ: true, message };
        } else if (
            !result.stderr.match(
                /error: pathspec '.*' did not match any file\(s\) known to git/
            )
        ) {
            throw new Error(result.stderr);
        }

        return { succ: false };
    }
}
