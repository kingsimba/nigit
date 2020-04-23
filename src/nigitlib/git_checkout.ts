import { CmdUtils, print, println, MessageType } from "./cmd_utils";
import { GitForAll as GitForAll } from "./git_forall";
import { GitConfig, GitProject } from "./git_config";
import fs from 'fs';

function getCurrentBranch(projDir: string): string {
    const cmd = `cd ${projDir} & git branch`;
    const result = CmdUtils.exec(cmd);
    if (result.exitCode == 0) {
        const m = result.stdout.match(/^\* (.*)$/m);
        if (m) {
            return m[1];
        }
    }

    return undefined;
}

function printBranchMessage(currentBranch: string, message: string) {
    if (message == undefined) {
        println(`* ${currentBranch}`, MessageType.warning);
    } else {
        print(`* ${currentBranch} `, MessageType.warning);
        println(message, MessageType.weakText);
    }
}

function printBranchWarning(currentBranch: string, missingBranch: string) {
    print(`* ${currentBranch} `, MessageType.text);
    println(`(Cannot find '${missingBranch}')`, MessageType.weakText);
}

export class GitCheckoutOptions {
    force: boolean;
}

class ProjectCheckoutResult {
    succ: boolean;
    message?: string;
}

export class GitCheckout {
    private branchName: string;
    private options: GitCheckoutOptions = { force: false };
    private mainProjectBranch: string;

    setOptions(options: GitCheckoutOptions) {
        this.options = options;
    }

    /**
     * Checkout to branch
     */
    cmdCheckout(branchName: string, options: GitCheckoutOptions): number {
        this.branchName = branchName;
        this.options = options;

        let exitCode = 0;
        try {
            this.mainProjectBranch = this._checkoutMainProject();

            GitForAll.forSubprojects('.', (projDir, proj) => {
                if (!this._checkoutSubproject(projDir, proj)) {
                    exitCode = 1;
                }
            });
        } catch (error) {
            print(error.message, MessageType.error);
            exitCode = 1;
        }

        return exitCode;
    }

    private _checkoutMainProject(): string {
        let mainProjectBranch: string;
        GitForAll.forMainProject('.', (projDir, proj) => {
            println(`=== ${proj.name} ===`);

            // checkout
            const coResult = this._checkout(projDir, this.branchName);

            // get current branch
            mainProjectBranch = getCurrentBranch(projDir);
            if (mainProjectBranch == undefined) {
                throw new Error(`Failed to get the branch name of main project '${proj.name}'`);
            }

            if (coResult.succ) {
                printBranchMessage(mainProjectBranch, coResult.message);
            } else {
                printBranchWarning(mainProjectBranch, this.branchName);
            }
        });

        return mainProjectBranch;
    }

    private _checkoutSubproject(projDir: string, proj: GitProject): boolean {
        try {
            if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
                return;
            }

            println(`=== ${proj.name} ===`);

            if (!proj.isGitRepository()) {
                println('(not a git repository)', MessageType.weakText);
                return;
            }

            // checkout to specified branch
            const coResult = this._checkout(projDir, this.branchName);
            if (!coResult.succ) {
                // if failed, checkout to the main project branch
                this._checkout(projDir, this.mainProjectBranch);
            }

            const branch = getCurrentBranch(projDir);
            if (coResult.succ) {
                printBranchMessage(branch, coResult.message);
            } else {
                printBranchWarning(branch, this.branchName);
            }

            return true;

        } catch (error) {
            print(error.message, MessageType.error);
            return false;
        }
    }

    _checkout(projDir: string, branchName: string): ProjectCheckoutResult {
        let checkoutSucc = false;
        let cmd = `cd ${projDir} & git checkout ${branchName} ${this.options.force ? '--force' : ''}`;
        let result = CmdUtils.exec(cmd);
        if (result.exitCode == 0) {
            let message;
            let m;
            if (m = result.stdout.match(/Your branch is behind '.*' by \d+ commits, and can be fast-forwarded/m)) {
                message = m[0];
            } else if (m = result.stdout.match(/Your branch and '.*' have diverged/m)) {
                message = m[0];
            }
            return { succ: true, message };
        } else if (!result.stderr.match(/error: pathspec '.*' did not match any file\(s\) known to git/)) {
            throw new Error(result.stderr);
        }

        return { succ: false };
    }
}
