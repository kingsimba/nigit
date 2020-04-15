import { CmdUtils, print, println } from "./cmd_utils";
import { GitForAll as GitForAll } from "./git_forall";
import { GitConfig } from "./git_config";

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

export class GitCheckout {

    /**
     * Checkout to branch
     */
    static cmdCheckout(branchName: string): number {

        const mainProjectBranchName = GitCheckout.checkoutMainProject(branchName);

        if (mainProjectBranchName == branchName) {
            println(`* ${branchName}`);
        } else {
            println(`warning: Branch ${branchName} doesn't exist. Currently on ${mainProjectBranchName}`);
        }

        GitForAll.forSubprojects('.', (projDir, proj) => {
            // checkout to specified branch
            let cmd = `cd ${projDir} & git checkout ${branchName}`;
            let result = CmdUtils.exec(cmd);
            if (result.exitCode == 0) {
                println(`* ${branchName}`);
            } else {
                // if failed, checkout to the main project branch
                cmd = `cd ${projDir} & git checkout ${mainProjectBranchName}`;
                result = CmdUtils.exec(cmd);
                if (result.exitCode == 0) {
                    println(`warning: Branch ${branchName} doesn't exist. Currently on ${mainProjectBranchName}`);
                } else {
                    // if failed, print current branch
                    const branch = getCurrentBranch(projDir);
                    println(`warning: Branch ${branchName} doesn't exist. Currently on ${branch}`);
                }
            }
        });

        return 0;
    }

    static checkoutMainProject(branchName: string): string {
        let mainProjectBranch: string;
        GitForAll.forMainProject('.', (projDir, proj) => {

            // checkout
            let checkoutSucc = false;
            let cmd = `cd ${projDir} & git checkout ${branchName}`;
            let result = CmdUtils.exec(cmd);
            if (result.exitCode == 0) {
                checkoutSucc = true;
            }

            // get current branch
            mainProjectBranch = getCurrentBranch(projDir);
            if (mainProjectBranch == undefined) {
                throw new Error(`Failed to get the branch name of main project ${proj.name}`);
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
