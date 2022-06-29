import { println, CmdUtils } from './cmd_utils';
import { GitForAll } from './git_forall';
import colors from 'colors';

export class GitTag {
    /**
     * push a branch to remote repository
     */
    static cmdListTags(pattern: string): number {
        const forall = GitForAll.instance('.');

        const proj = forall.mainProject;
        const projDir = proj.directory;

        return CmdUtils.execInConsole(`cd ${projDir} && git tag -l "${pattern}"`);
    }

    static cmdCreateTag(tagName: string): number {
        const forall = GitForAll.instance('.');

        // Check existing tag. make sure no project has this tag.
        const table = forall.newTablePrinter();
        if (table == undefined) {
            return 1;
        }
        table.printHeader('Project', 'Message');

        let failed = false;
        for (const proj of forall.projects) {
            const projDir = proj.directory;
            if (!proj.isGitRepository()) {
                continue;
            }

            const result = CmdUtils.exec(`cd ${projDir} && git tag -l \"${tagName}\"`);
            if (result.stdout.split('\n').find((o) => o == tagName)) {
                table.printLine(proj.name, colors.red(`tag '${tagName}' already exist`));
                failed = true;
            } else if (result.exitCode != 0) {
                table.printLine(proj.name, colors.red(`error: ${result.stdout}`));
                failed = true;
            }
        }

        // Create tag
        if (!failed) {
            for (const proj of forall.projects) {
                const projDir = proj.directory;
                if (!proj.isGitRepository()) {
                    table.printLine(proj.name, colors.grey('(Not a git repository)'));
                    continue;
                }

                const result = CmdUtils.exec(`cd ${projDir} && git tag \"${tagName}\"`);
                if (result.exitCode != 0) {
                    table.printLine(proj.name, colors.red(`error: ${result.stdout}`));
                } else {
                    table.printLine(proj.name, colors.green(`'${tagName}' created`));
                }
            }
        }

        return 0;
    }
}
