import fs, { write } from 'fs';
import { CmdUtils, MessageType, println } from './cmd_utils';
import { GitForAll } from './git_forall';
import { GitStatus } from './git_status';

export class ProjectGitInfo {
    constructor(public projectName: string, public branchName: string, public hashCode: string, public log: string) {}
}

/**
 *
 * Dump information into a .gitinfo file.
 * @remarks
 *   *.gitinfo file looks like:
 *
 *   ```
 *   cq_stdlib [master|d1bfcf1] Merge remote-tracking branch 'origin/dependabot/npm_and_yarn/lodash-4.17.21'
 *   mapdal [master|19be175] remove unused dependency
 *   nc-runtime [master|44522e3] remove catkin_make related commits
 *   ```
 */
export class InfoDumper {
    /**
     * Switch projects to point specified by a git.info file
     * @param fileName A gitinfo file which contains project names and hash codes
     */
    dump(fileName: string) {
        if (!GitStatus.allIsClean()) {
            throw new Error('working copy is not clean');
        }

        let hasError = false;
        const infos: ProjectGitInfo[] = [];
        GitForAll.forAll('.', (projDir, proj) => {
            if (proj.isGitRepository()) {
                if (!fs.existsSync(projDir)) {
                    println(`error: Folder ${projDir} doesn't exist`, MessageType.error);
                    hasError = true;
                } else {
                    const cmd = `cd ${projDir} && git branch -v`;
                    const result = CmdUtils.exec(cmd);
                    if (result.exitCode != 0) {
                        println(`error: Failed to get git info from ${projDir}`, MessageType.error);
                    } else {
                        const info = this._parseGitInfo(result.stdout, proj.name);
                        if (info == null) {
                            println(`error: Failed to parse output for project ${proj.name}: ${result.stdout}`);
                            hasError = true;
                        } else {
                            infos.push(info);
                        }
                    }
                }
            }
        });

        if (hasError) {
            throw new Error('Some projects has error');
        }

        let writeStream = null;
        if (fileName != null) {
            writeStream = fs.createWriteStream(fileName);
        }

        for (const info of infos) {
            const log = `${info.projectName} [${info.branchName}|${info.hashCode}] ${info.log}`;
            if (writeStream == null) {
                console.log(log);
            } else {
                writeStream.write(log);
                writeStream.write('\n');
            }
        }

        writeStream?.close();
    }

    _parseGitInfo(text: string, projectName: string): ProjectGitInfo | null {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('* ')) {
                const m = line.match(/\* ([\w\-_\/\.]+|\(.*\))\s+([0-9a-f]+)\s+(.*)/);
                if (m != null) {
                    const branch = m[1];
                    const hash = m[2];
                    const log = m[3];
                    return new ProjectGitInfo(projectName, branch, hash, log);
                }
            }
        }

        return null;
    }
}
