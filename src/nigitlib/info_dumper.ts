import fs, { write } from 'fs';
import { CmdUtils, MessageType, println } from "./cmd_utils";
import { GitForAll } from './git_forall';

export class ProjectGitInfo {
    constructor(public projectName: string, public branchName: string, public hashCode: string, public log: string) { }
};


/**
 *
 * Dump information into a .gitinfo file.
 * @remarks
 *   *.gitinfo file looks like:
 *     
 *   ```
 *   cq_stdlib (detached from origin/master) d1bfcf1 Merge remote-tracking branch 'origin/dependabot/npm_and_yarn/lodash-4.17.21'
 *   mapdal (detached from origin/master) 19be175 [gone] remove unused dependency
 *   nc-runtime (detached from origin/master) 44522e3 remove catkin_make related commits
 *   ```
 */
export class InfoDumper {

    /**
     * Switch projects to point specified by a git.info file
     * @param fileName A gitinfo file which contains project names and hash codes
     */
    dump(fileName: string): boolean {
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
            return false;
        }

        if (fileName == null) {
            for (const info of infos) {
                console.log(`${info.projectName} ${info.branchName} ${info.hashCode} ${info.log}`);
            }
        } else {
            if (!fileName.endsWith(".gitinfo")) {
                fileName += ".gitinfo";
            }
            let writeStream = fs.createWriteStream(fileName);
            for (const info of infos) {
                writeStream.write(`${info.projectName} ${info.branchName} ${info.hashCode} ${info.log}\n`, "utf8");
            }
            writeStream.close();
        }

        return true;
    }

    _parseGitInfo(text: string, projectName: string): ProjectGitInfo | null {
        const lines = text.split("\n");
        for (const line of lines) {
            if (line.startsWith("* ")) {
                const m = line.match(/\* (\w+)\s+([0-9a-f]+)\s+(.*)/);
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
