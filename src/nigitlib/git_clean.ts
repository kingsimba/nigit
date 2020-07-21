import { println, CmdUtils } from "./cmd_utils";
import { GitForAll } from "./git_forall";
import colors from 'colors';

export interface GitCleanOption {
    force?: boolean;
    dry?: boolean;
}

export class GitClean {
    /**
     * Run 'git clean -f'
     * @param force Remove untracked files
     */
    static cmdClean(options: GitCleanOption): number {
        const forall = GitForAll.instance('.');
        if (forall == undefined) {
            return 1;
        }

        if (!options.force && !options.dry) {
            println('error: either --force or --force must be given');
            return 1;
        }

        const table = forall.newTablePrinter();
        if (table == undefined) {
            return 1;
        }
        table.printHeader('Project', 'Message');

        // compose arguments
        const args: string[] = [];
        if (options.force) {
            args.push('--force');
        }
        if (options.dry) {
            args.push('--dry');
        }

        // run git clean for all projects
        let failed = false;
        for (const proj of forall.exitingGitProjects) {
            const projDir = proj.directory;

            const result = CmdUtils.exec(`cd ${projDir} & git clean ${args.join(' ')}`);
            if (result.exitCode == 0) {
                if (result.stdout.length != 0) {
                    table.printLines(proj.name, result.stdout.split('\n'));
                }
            } else if (result.exitCode != 0) {
                table.printLine(proj.name, colors.red(`error: ${result.stderr}`));
                failed = true;
            }
        }

        return failed ? 1 : 0;
    }
}
