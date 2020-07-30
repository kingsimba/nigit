import fs from 'fs';
import { CmdUtils, println } from "./cmd_utils";

export class GitInfo {
    constructor(public name: string, public hashCode: string) { }
};


/**
 *
 * Used to checkout projects to specific points, based on *.gitinfo file.
 * @remarks
 *      *.gitinfo file looks like:
 *      cq_stdlib (detached from origin/master) d1bfcf1
 *      mapdal (detached from origin/master) 19be175
 *      dalr (detached from origin/master) 44522e3
 *      gtest (detached from origin/master) 3204ba3
 */
export class GitSwitcher {

    /**
     * Switch projects to point specified by a git.info file
     * @param fileName A gitinfo file which contains project names and hash codes
     */
    switchWithGitInfoFile(fileName: string) {
        const cmdResult = CmdUtils.exec('git status');
        const isGitDirectory = cmdResult.exitCode === 0;

        if (isGitDirectory) {
            console.error('error: This command must be run outside of git directory');
            return;
        }

        if (!fs.existsSync(fileName)) {
            console.error(`error: file not exist: ${fileName}`);
            return;
        }

        console.log('checking out project with info file: ' + fileName);
        const fileText = this._loadTextFile(fileName);
        if (fileText == null) {
            println(`error: failed to load file ${fileName}`);
            return;
        }
        const infos = this._parseGitInfo(fileText);
        this._checkoutWithGitInfos(infos);
    }

    _loadTextFile(fileName: string): string | null {
        try {
            return fs.readFileSync(fileName, 'utf8');
        } catch (error) {
            return null;
        }
    }

    _parseGitInfo(fileText: string): GitInfo[] {
        let lines = fileText.split('\n');
        lines = lines.filter(o => o.trim() !== '')

        const infos: GitInfo[] = [];

        lines.forEach(line => {
            const m = line.match(/([^\s]+) \(.*\) ([^\s]+)/);
            if (m) {
                infos.push(new GitInfo(m[1], m[2]));
            }
        });

        return infos;
    }

    _checkoutWithGitInfos(infos: GitInfo[]) {
        infos.forEach(info => {
            const cmd = `cd ${info.name} && git checkout ${info.hashCode}`;

            console.log(`$ '${cmd}'`);
            const cmdResult = CmdUtils.exec(cmd);
            if (cmdResult.exitCode !== 0) {
                console.log(cmdResult.stderr);
                console.error("error: failed to run command");
            }
        });
    }
}
