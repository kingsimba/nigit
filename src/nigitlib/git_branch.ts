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
        const nameColumnLength = this.maximumNameLength() + 3;
        console.log(colors.green('Project'.padEnd(nameColumnLength) + 'Branches'))

        this.options = options;
        this.showCurrentBranch = options.all == undefined && options.features == undefined;

        if (this.showCurrentBranch) {
            this.executeCurrentBranch(nameColumnLength, options);
            return;
        }

        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            if (!proj.isGitRepository()) {
                console.log(proj.name.padEnd(nameColumnLength) + colors.grey('(not git repo)'));
            } else {
                if (options.features) {
                    // remove master and branches/*
                    branches = branches.filter(o => !o.match(/\*? ?(branches\/.*|master)$/));
                }

                for (let [i, branch] of branches.entries()) {
                    // change current branch to yellow color
                    if (branch.startsWith('* ')) {
                        branch = colors.yellow(branch.substr(2) + '(*)');
                    }

                    if (i == 0) {
                        console.log(proj.name.padEnd(nameColumnLength) + branch);
                    } else {
                        console.log(''.padEnd(nameColumnLength) + branch);
                    }
                }
            }
        });
    }

    private executeCurrentBranch(nameColumnLength: number, options: any) {
        let firstProject = true;
        let firstProjectBranch = '';
        this.cmdGitForAllWithOutputHandler('git branch', (proj: GitProject, branches: string[]) => {
            let branch = branches.find(o => o.startsWith('* '));
            if (!proj.isGitRepository()) {
                console.log(proj.name.padEnd(nameColumnLength) + colors.grey('(not git repo)'));
            } else if (branch) {
                branch = branch.substr(2);
                if (firstProject) {
                    firstProjectBranch = branch;
                }

                // If the branch is different from the first project(main project), it should be warned
                if (branch !== firstProjectBranch) {
                    branch = colors.yellow(branch);
                }

                console.log(proj.name.padEnd(nameColumnLength) + branch);
            } else {
                console.log(proj.name.padEnd(nameColumnLength) + colors.red('(error)'));
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

    private maximumNameLength(): number {
        let maxLength = 0;
        GitForAll.forAll('.', (projDir, proj) => {
            maxLength = Math.max(maxLength, proj.name.length);
        });

        return maxLength;
    }
}

export const gitBranch = new GitBranch();
