import fs from 'fs';
import { CmdUtils, println } from "./cmd_utils";
import { GitStatus } from './git_status';
import { TablePrinter } from './table-printer';

export class GitInfo {
    constructor(public name: string, public hashCode: string, public log: string) { }
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
     * Switch projects to point specified by a .gitinfo file
     * @param fileName A gitinfo file which contains project names and hash codes
     */
    switchWithGitInfoFile(fileName: string): number {
        if (!GitStatus.allIsClean()) {
            println("error: working copy is not clean");
            return 1;
        }

        const cmdResult = CmdUtils.exec('git status');
        const isGitDirectory = cmdResult.exitCode === 0;

        if (isGitDirectory) {
            console.error('error: This command must be run outside of git directory');
            return 1;
        }

        if (!fs.existsSync(fileName)) {
            console.error(`error: file not exist: ${fileName}`);
            return 1;
        }

        console.log('checking out project with info file: ' + fileName);
        const fileText = this._loadTextFile(fileName);
        if (fileText == null) {
            println(`error: failed to load file ${fileName}`);
            return 1;
        }
        const infos = this._parseGitInfo(fileText);
        this._checkoutWithGitInfos(infos);

        return 0;
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
            const m = line.match(/([^\s]+) \[(.*)\|(.*)\] (.*)/);
            if (m) {
                infos.push(new GitInfo(m[1], m[3], m[4]));
            }
        });

        return infos;
    }

    _checkoutWithGitInfos(infos: GitInfo[]) {
        const table = new TablePrinter();

        // print table header
        let maxWidth = 0;
        for (const info of infos) {
            maxWidth = Math.max(info.name.length, maxWidth);
        }
        table.firstColumnWidth = maxWidth + 1;
        table.printHeader("Project", "Hash");

        // Switch projects
        for (const info of infos) {
            const cmd = `cd ${info.name} && git checkout ${info.hashCode}`;
            const cmdResult = CmdUtils.exec(cmd);
            if (cmdResult.exitCode == 0) {
                table.printLine(info.name, `${info.hashCode} ${info.log}`);
            }
            else {
                console.log(cmdResult.stderr);
                console.error("error: failed to run command");
            }
        }
    }
}
