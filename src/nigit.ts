#!/usr/bin/env node
import program from 'commander';
import process from 'process';
import { GitSwitcher } from "./nigitlib/git_switcher";
import { GitStatus } from "./nigitlib/git_status";
import { GitForAll } from './nigitlib/git_forall';
import { GitPull } from './nigitlib/git_pull';
import { println } from './nigitlib/cmd_utils';

class Options {
    infoFile: string;
    workingDir: string;
}

program
    .command('checkout [BRANCH_NAME]')
    .option('-i, --info-file <FILE>')
    .action((branchName: string, opts: Options) => {
        if (branchName && opts.infoFile) {
            console.log("error: BRANCH_NAME and INFO_FILE cannot coexist!");
        } else if (branchName) {
            console.log("error: Not implemented!");
        } else if (opts.infoFile) {
            const switcher = new GitSwitcher();
            switcher.switchWithGitInfoFile(opts.infoFile);
        } else {
            console.log("error: either BRANCH_NAME or INFO_FILE must be given");
        }
    })

program
    .command('forall <COMMAND>')
    .option('--working-dir <DIR>')
    .action((command: string, opts: Options) => {
        if (opts.workingDir) {
            process.chdir(opts.workingDir);
        }
        GitForAll.cmdGitForAll(command);
    })

program
    .command('list')
    .option('--working-dir <DIR>')
    .action((command: string, opts: Options) => {
        if (opts.workingDir) {
            process.chdir(opts.workingDir);
        }
        GitForAll.forAll('.', (projDir, proj) => {
            println(`${proj.name} => ${proj.url}`);
        });
    })

program
    .command('status')
    .option('--working-dir <DIR>')
    .action((opts: Options) => {
        if (opts.workingDir) {
            process.chdir(opts.workingDir);
        }
        GitStatus.cmdStatus();
    })

program
    .command('pull')
    .option('--working-dir <DIR>')
    .action((opts: Options) => {
        if (opts.workingDir) {
            process.chdir(opts.workingDir);
        }
        GitPull.cmdGitPull();
    })


program.parse(process.argv);

