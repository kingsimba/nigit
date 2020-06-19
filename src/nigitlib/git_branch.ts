import { GitForAll } from "./git_forall";
import { println, CmdUtils } from "./cmd_utils";
import fs from 'fs';
import { GitProject } from "./git_config";
import colors from "colors";
import { TablePrinter } from "./table-printer";

class GitBranch {
    options: any;
    private showCurrentBranch: boolean;

    execute(options: any) {
        const table = GitForAll.newTablePrinter();
        if (table == undefined)
            return;

        this.options = options;
        this.showCurrentBranch = options.all == undefined && options.features == undefined;

        if (this.showCurrentBranch) {
            table.printHeader('Project', 'Current Branch');
            this.executeCurrentBranch(table, options);
            return;
        } else {
            table.printHeader('Project', 'Branches');
        }

        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            if (!proj.isGitRepository()) {
                table.printLine(proj.name, colors.grey('(not git repo)'));
            } else {
                if (options.features) {
                    // remove master and branches/*
                    branches = branches.filter(o => !o.match(/\*? ?(branches\/.*|master)$/));
                }

                branches = branches.map(b => b.startsWith('* ') ? colors.yellow(b.substr(2) + '(*)') : b);
                table.printLines(proj.name, branches);
            }
        });
    }

    private executeCurrentBranch(table: TablePrinter, options: any) {
        let firstProject = true;
        let firstProjectBranch = '';
        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            let branch = branches.find(o => o.startsWith('* '));
            if (!proj.isGitRepository()) {
                table.printLine(proj.name, colors.grey('(not git repo)'));
            } else if (branch) {
                branch = branch.substr(2);
                if (firstProject) {
                    firstProjectBranch = branch;
                }

                // If the branch is different from the first project(main project), it should be warned
                if (branch !== firstProjectBranch) {
                    branch = colors.yellow(branch);
                }

                table.printLine(proj.name, branch);
            } else {
                table.printLine(proj.name, colors.red('(error)'));
            }

            firstProject = false;
        });
    }


    /**
     * Execute the same command for all projects. If succeeded, handle the output.
     */
    private cmdGitForAllWithOutputHandler(command: string, handler: (proj: GitProject, branches: string[]) => void): number {
        GitForAll.forAll('.', (projDir, proj) => {
            if (proj.isGitRepository()) {
                if (fs.existsSync(projDir)) {
                    const cmd = `cd ${projDir} & ${command}`;
                    const result = CmdUtils.exec(cmd);
                    if (result.exitCode !== 0) {
                        println(`=== ${proj.name} ===`);
                        CmdUtils.printCommandError(cmd, result.stdout);
                    } else {
                        const branches = result.stdout.split('\n').map(o => o.trim()).filter(o => o.length !== 0);
                        handler(proj, branches);
                    }
                }
            } else {
                handler(proj, []);
            }
        })

        return 0;
    }
}

export const gitBranch = new GitBranch();
