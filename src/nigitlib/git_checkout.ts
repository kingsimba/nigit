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

function checkout(projDir: string, branchName: string) {
    let checkoutSucc = false;
    let cmd = `cd ${projDir} & git checkout ${branchName}`;
    let result = CmdUtils.exec(cmd);
    if (result.exitCode == 0) {
        return true;
    } else if (!result.stderr.match(/error: pathspec '.*' did not match any file\(s\) known to git/)) {
        throw new Error(result.stderr);
    }

    return false;
}

export class GitCheckout {

    /**
     * Checkout to branch
     */
    static cmdCheckout(branchName: string): number {
        try {
            const mainProjectBranch = GitCheckout.checkoutMainProject(branchName);

            GitForAll.forSubprojects('.', (projDir, proj) => {
                println(`=== ${proj.name} ===`);

                if (!proj.isGitRepository()) {
                    println('(not a git repository)');
                    return;
                }

                if (!fs.existsSync(projDir) || !fs.statSync(projDir).isDirectory()) {
                    println("error: subproject doesn't exist. Please run `nigit pull` first?");
                    return;
                }

                // checkout to specified branch
                if (!checkout(projDir, branchName)) {
                    // if failed, checkout to the main project branch
                    if (checkout(projDir, mainProjectBranch)) {
                        println(`warning: pathspec '${branchName}' did not match any file\(s\) known to git. Currently on '${mainProjectBranch}'`);
                    } else {
                        // if failed, print current branch
                        const branch = getCurrentBranch(projDir);
                        println(`warning: pathspec '${branchName}' did not match any file\(s\) known to git. Currently on '${branch}'`);
                    }
                }
            });
        } catch (error) {
            print(error.message, MessageType.error);
            return 1;
        }

        return 0;
    }

    static checkoutMainProject(branchName: string): string {
        let mainProjectBranch: string;
        GitForAll.forMainProject('.', (projDir, proj) => {
            println(`=== ${proj.name} ===`);

            // checkout
            checkout(projDir, branchName);

            // get current branch
            mainProjectBranch = getCurrentBranch(projDir);
            if (mainProjectBranch == undefined) {
                throw new Error(`Failed to get the branch name of main project '${proj.name}'`);
            }

            if (mainProjectBranch == branchName) {
                println(`* ${branchName}`);
            } else {
                println(`warning: pathspec '${branchName}' did not match any file\(s\) known to git. Currently on '${mainProjectBranch}'`);
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
