import { CmdUtils, println } from './cmd_utils';
import { GitForAll as GitForAll } from './git_forall';
import fs from 'fs';
import colors from 'colors';

export class GitStatusInfo {
    constructor(public projName: string, public messages: string[]) { }
}

export class GitStatus {
    /**
     * Print the status of projects. In current directory.
     */
    static getInfos(forall: GitForAll): GitStatusInfo[] {
        const infos: GitStatusInfo[] = [];

        for (const proj of forall.projects) {
            const projDir = proj.directory;

            if (!proj.isGitRepository()) {
                continue;
            }

            if (!fs.existsSync(projDir)) {
                // often because have no access
                continue;
            }

            const result = CmdUtils.exec(`cd ${projDir} && git status`);
            if (result.exitCode == 0) {
                if (result.stdout.indexOf('nothing to commit, working tree clean') == -1) {
                    infos.push(new GitStatusInfo(proj.name, this._filterOutput(result.stdout)));
                }
            } else {
                infos.push(new GitStatusInfo(proj.name, [result.stderr]));
            }
        }

        return infos;
    }

    static allIsClean(): boolean {
        const forall = GitForAll.instance('.');
        const infos = GitStatus.getInfos(forall);
        return infos.length == 0;
    }

    /**
     * Print the status of projects. In current directory.
     */
    static cmdStatus(): number {
        const forall = GitForAll.instance('.');
        const infos = GitStatus.getInfos(forall);

        if (infos.length == 0) {
            println('Nothing to commit, all working trees are clean');
            return 0;
        }

        const table = forall.newTablePrinter();
        table.printHeader('Project', 'Changes');
        for (const info of infos) {
            table.printLines(info.projName, info.messages);
        }

        return 0;
    }

    /**
     * Show only the modified files with '+-?M' prefix
     */
    static _filterOutput(text: string): string[] {
        const rtn: string[] = [];
        const lines = text.split('\n');
        lines.forEach((line) => {
            if ((line.startsWith(' ') || line.startsWith('\t')) && !line.trim().startsWith('(')) {
                line = line.trim();
                if (line.startsWith('modified:')) {
                    line = line.replace(/^modified:\s*/, 'M ');
                } else if (line.startsWith('new file:')) {
                    line = colors.green(line.replace(/^new file:\s*/, '+ '));
                } else if (line.startsWith('deleted:')) {
                    line = colors.red(line.replace(/^deleted:\s*/, '- '));
                } else {
                    line = colors.grey('? ' + line); // untracked file
                }
                rtn.push(line);
            }
        });
        return rtn;
    }
}
