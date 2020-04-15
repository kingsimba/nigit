import { CmdUtils, print, println, MessageType } from "./cmd_utils";
import { GitForAll as GitForAll } from "./git_forall";
import { GitConfig } from "./git_config";
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

function checkout(projDir: string, branchName: string): { succ: boolean, message?: string } {
    let checkoutSucc = false;
    let cmd = `cd ${projDir} & git checkout ${branchName}`;
    let result = CmdUtils.exec(cmd);
    if (result.exitCode == 0) {
        let message;
        let m = result.stdout.match(/Your branch is behind '.*' by \d+ commits, and can be fast-forwarded/m);
        if (m) {
            message = m[0];
        }
        m = result.stdout.match(/Your branch and '.*' have diverged/m);
        if (m) {
            message = m[0];
        }
        return { succ: true, message };
    } else if (!result.stderr.match(/error: pathspec '.*' did not match any file\(s\) known to git/)) {
        throw new Error(result.stderr);
    }

    return { succ: false };
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

export class GitCheckout {

    /**
     * Checkout to branch
     */
    static cmdCheckout(branchName: string): number {
        let exitCode = 0;
        try {
            const mainProjectBranch = GitCheckout.checkoutMainProject(branchName);

            GitForAll.forSubprojects('.', (projDir, proj) => {
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
                    const coResult = checkout(projDir, branchName);
                    if (!coResult.succ) {
                        // if failed, checkout to the main project branch
                        checkout(projDir, mainProjectBranch);
                    }

                    const branch = getCurrentBranch(projDir);
                    if (coResult.succ) {
                        printBranchMessage(branch, coResult.message);
                    } else {
                        printBranchWarning(branch, branchName);
                    }
                } catch (error) {
                    print(error.message, MessageType.error);
                    exitCode = 1;
                }
            });
        } catch (error) {
            print(error.message, MessageType.error);
            exitCode = 1;
        }

        return exitCode;
    }

    static checkoutMainProject(branchName: string): string {
        let mainProjectBranch: string;
        GitForAll.forMainProject('.', (projDir, proj) => {
            println(`=== ${proj.name} ===`);

            // checkout
            const coResult = checkout(projDir, branchName);

            // get current branch
            mainProjectBranch = getCurrentBranch(projDir);
            if (mainProjectBranch == undefined) {
                throw new Error(`Failed to get the branch name of main project '${proj.name}'`);
            }

            if (coResult.succ) {
                printBranchMessage(mainProjectBranch, coResult.message);
            } else {
                printBranchWarning(mainProjectBranch, branchName);
            }
        });

        return mainProjectBranch;
    }

    static _filterOutput(text: string): string {
        const rtn: String[] = [];
        const lines = text.split('\n');
        lines.forEach(line => {
            if ((line.startsWith(' ') || line.startsWith('\t')) && !line.trim().startsWith('(')) {
                line = line.trim();
                if (line.startsWith('modified:')) {
                    line = line.replace(/^modified:\s*/, 'M ')
                } else if (line.startsWith('new file:')) {
                    line = line.replace(/^new file:\s*/, '+ ')
                } else if (line.startsWith('deleted:')) {
                    line = line.replace(/^deleted:\s*/, '- ')
                } else {
                    line = '? ' + line; // untracked file
                }
                rtn.push(line);
            }
        });
        rtn.push('');
        return rtn.join('\n');
    }
}
