import { CmdUtils, print, println, MessageType } from "./cmd_utils";
import { GitForAll as GitForAll } from "./git_forall";
import fs from 'fs';

export class GitStatus {

    /**
     * Print the status of projects. In current directory.
     */
    static cmdStatus(): number {
        let allIsClean = true;
        GitForAll.forAll('.', (projDir, proj) => {
            if (!proj.isGitRepository()) {
                return;
            }

            if (!fs.existsSync(projDir)) {
                // often because have no access
                return;
            }
            
            const result = CmdUtils.exec(`cd ${projDir} & git status`);
            if (result.exitCode == 0) {
                if (result.stdout.indexOf('nothing to commit, working tree clean') == -1) {
                    allIsClean = false;
                    println(`=== ${proj.name} ===`);
                    print(this._filterOutput(result.stdout));
                }
            } else {
                allIsClean = false;
                println(`=== ${proj.name} ===`);
                print(result.stderr);
            }
        });

        if (allIsClean) {
            println('Nothing to commit, all working trees are clean');
        }

        return 0;
    }

    /**
     * Show only the modified files with '+-?M' prefix
     * @param text 
     */
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
