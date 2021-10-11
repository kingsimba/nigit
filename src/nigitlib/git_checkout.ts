import { CmdUtils, print, MessageType } from './cmd_utils';
import { GitForAll } from './git_forall';
import { GitProject } from './git_config';
import colors from 'colors';
import fs from 'fs';
import { TablePrinter } from './table-printer';

export function getCurrentBranchFromOutput(output: string): string | null {
    let m = output.match(/^\* \(.* detached at (.*)\)$/m);
    if (m) {
        return m[1];
    }
    m = output.match(/^\* (.*)$/m);
    if (m) {
        return m[1];
    }

    return null;
}

function getCurrentBranch(projDir: string): string | null {
    const cmd = `cd ${projDir} && git branch`;
    const result = CmdUtils.exec(cmd);
    if (result.exitCode == 0) {
        return getCurrentBranchFromOutput(result.stdout);
    }

    return null;
}

function getBranchMessage(currentBranch: string, message: string) {
    if (message == undefined) {
        return `* ${currentBranch}`;
    } else {
        return `* ${currentBranch} ` + colors.grey(message);
    }
}

function getBranchWarning(currentBranch: string, missingBranch: string) {
    return colors.yellow(`* ${currentBranch} `) + colors.grey(`(Cannot find '${missingBranch}')`);
}

export class GitCheckoutOptions {
    force: boolean = false;
}

class ProjectCheckoutResult {
    succ: boolean = false;
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
        const forall = GitForAll.instance('.');
        if (forall == undefined) {
            return 1;
        }

        const table = forall.newTablePrinter();
        if (table == undefined) {
            return 1;
        }

        table.printHeader('Project', 'Branches');
        this.branchName = branchName;
        this.options = options;

        try {
            this.mainProjectBranch = this._checkoutMainProject(forall.mainProject, table);
        } catch (error) {
            table.firstColumnWidth = forall.mainProject.name.length + 2;
            table.printLine(forall.mainProject.name, colors.red(error.message));
            return 1;
        }

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
        const mainProjectBranch = getCurrentBranch(projDir);
        if (mainProjectBranch == undefined) {
            throw new Error(`Failed to get the branch name of main project '${proj.name}'`);
        }

        if (coResult.succ) {
            table.printLine(proj.name, getBranchMessage(mainProjectBranch, coResult.message || ''));
        } else {
            table.printLine(proj.name, getBranchWarning(mainProjectBranch, this.branchName));
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

            const branch = getCurrentBranch(projDir);
            if (coResult.succ) {
                table.printLine(proj.name, getBranchMessage(branch!, coResult.message || ''));
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

    _checkout(projDir: string, branchName: string): ProjectCheckoutResult {
        const checkoutSucc = false;
        const cmd = `cd ${projDir} && git checkout ${branchName} ${this.options.force ? '--force' : ''}`;
        const result = CmdUtils.exec(cmd);
        if (result.exitCode == 0) {
            let message;
            let m;
            // tslint:disable-next-line: no-conditional-assignment
            if ((m = result.stdout.match(/Your branch is behind '.*' by \d+ commits, and can be fast-forwarded/m))) {
                message = m[0];
                // tslint:disable-next-line: no-conditional-assignment
            } else if ((m = result.stdout.match(/Your branch and '.*' have diverged/m))) {
                message = m[0];
            }
            return { succ: true, message };
        } else if (!result.stderr.match(/error: pathspec '.*' did not match any file\(s\) known to git/)) {
            throw new Error(result.stderr);
        }

        return { succ: false };
    }
}
