import fs from 'fs';
import { CmdUtils, println } from './cmd_utils';
import { GitStatus } from './git_status';
import { TablePrinter } from './table-printer';

export class GitInfo {
    constructor(public name: string, public hashCode: string, public log: string) { }
}

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
    switchWithGitInfoFile(fileName: string) {
        if (!GitStatus.allIsClean()) {
            throw new Error('error: working copy is not clean');
        }

        const cmdResult = CmdUtils.exec('git status');
        const isGitDirectory = cmdResult.exitCode === 0;

        if (isGitDirectory) {
            throw new Error('error: This command must be run outside of git directory');
        }

        if (!fs.existsSync(fileName)) {
            throw new Error(`error: file not exist: ${fileName}`);
        }

        console.log('checking out project with info file: ' + fileName);
        const fileText = this._loadTextFile(fileName);
        if (fileText == null) {
            throw new Error(`error: failed to load file ${fileName}`);
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
        lines = lines.filter((o) => o.trim() !== '');

        const infos: GitInfo[] = [];

        lines.forEach((line) => {
            const m = line.match(/([^\s]+) \[((.*)\|)?(.*)\] (.*)/);
            if (m) {
                infos.push(new GitInfo(m[1], m[4], m[5]));
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
        table.printHeader('Project', 'Hash');

        // Switch projects
        let somethingIsWrong = false;
        for (const info of infos) {
            const cmd = `cd ${info.name} && git checkout ${info.hashCode}`;
            const cmdResult = CmdUtils.exec(cmd);
            if (cmdResult.exitCode == 0) {
                table.printLine(info.name, `${info.hashCode} ${info.log}`);
            } else {
                println(cmdResult.stderr);
                println('error: failed to run command');
                somethingIsWrong = true;
            }
        }

        if (somethingIsWrong) {
            throw new Error('Failed to run some commands');
        }
    }
}
