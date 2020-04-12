#!/usr/bin/env node
import program from 'commander';
import process from 'process';
import { GitSwitcher } from "./nigitlib/git_switcher";
import { GitForAll } from './nigitlib/git_forall';
import { println, print, MessageType, CmdUtils } from './nigitlib/cmd_utils';
import { GitStatus } from './nigitlib/git_status';
import { GitPull } from './nigitlib/git_pull';
import fs from 'fs';
import { GitProject } from './nigitlib/git_config';

class Options {
    infoFile: string;
    workingDir: string;
}

function createWorkDirFileForUrl(path: string, url: string) {
    const proj = GitProject.instanceWithUrl(url);
    fs.writeFileSync(`${path}/.nigit.workspace`, JSON.stringify({ master_project: proj.name }));
}

program
    .version('0.1.0')

program
    .command('clone <URL>')
    .action((url: string) => {
        const cmd = `git clone ${url}`;
        println('> ' + cmd);
        if (CmdUtils.execInConsole(cmd) !== 0) {
            process.exit(1);
        }

        createWorkDirFileForUrl('.', url);
        GitPull.cmdGitPull({ updateMainProject: false });
    })

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
    .action((command: string) => {
        GitForAll.cmdGitForAll(command);
    })

program
    .command('list')
    .action(() => {
        GitForAll.forAll('.', (projDir, proj) => {
            print(proj.name, MessageType.info);
            print(` => ${proj.url}\n`);
        });
    })

program
    .command('status')
    .action(() => {
        GitStatus.cmdStatus();
    })

program
    .command('pull')
    .action(() => {
        GitPull.cmdGitPull();
    })


program.parse(process.argv);

