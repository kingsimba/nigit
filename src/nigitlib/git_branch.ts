import { GitForAll } from "./git_forall";
import { print, println, CmdUtils } from "./cmd_utils";
import fs from 'fs';
import { GitProject } from "./git_config";
import Table from 'cli-table';
import colors from "colors";

class GitBranch {
    options: any;
    private showCurrentBranch: boolean;

    execute(options: any) {
        const table = new Table({
            head: [colors.green('Project'), colors.green('Branches')]
            , colWidths: [30, 30]
        });

        this.options = options;
        this.showCurrentBranch = options.all == undefined && options.features == undefined;

        if (this.showCurrentBranch) {
            this.executeCurrentBranch(options);
            return;
        }

        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            if (!proj.isGitRepository()) {
                table.push([proj.name, colors.grey('(not git repo)')]);
            } else {
                if (options.features) {
                    // remove master and branches/*
                    branches = branches.filter(o => !o.match(/\*? ?(branches\/.*|master)$/));
                }
                // change current branch to yellow color
                branches = branches.map(o => o.startsWith('* ') ? colors.yellow(o) : o);
                table.push([proj.name, branches.join('\n')]);
            }
        });

        console.log(table.toString());
    }

    private executeCurrentBranch(options: any) {
        const table = new Table({
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
                , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
                , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
                , 'right': '', 'right-mid': '', 'middle': ' '
            },
            style: { 'padding-left': 0, 'padding-right': 0 },
            head: [colors.green('Project'), colors.green('Current Branch')]
            , colWidths: [30, 30]
        });

        let firstProject = true;
        let firstProjectBranch = '';
        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            let branch = branches.find(o => o.startsWith('* '));
            if (!proj.isGitRepository()) {
                table.push([proj.name, colors.grey('(not git repo)')]);
            } else if (branch) {
                branch = branch.substr(2);
                if (firstProject) {
                    firstProjectBranch = branch;
                }

                if (branch !== firstProjectBranch) {
                    branch = colors.yellow(branch);
                }

                table.push([proj.name, branch + '\n' + branch]);
            } else {
                table.push([proj.name, colors.red('(error)')]);
            }

            firstProject = false;
        });

        console.log(table.toString());
    }


    /**
     * Execute the same command for all projects. If succeeded, handle the output.
     */
    cmdGitForAllWithOutputHandler(command: string, handler: (proj: GitProject, branches: string[]) => void): number {
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
