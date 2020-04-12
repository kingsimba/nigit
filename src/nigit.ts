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

function createWorkDirFileForUrl(path: string, url: string) {
    const proj = GitProject.instanceWithUrl(url);
    fs.writeFileSync(`${path}/.nigit.workspace`, JSON.stringify({ master_project: proj.name }));
}

program
    .version('0.1.0')

program
    .command('clone <URL>')
    .description('Clone a main project and all its subprojects')
    .action((url: string) => {
        const cmd = `git clone ${url}`;
        println('> ' + cmd);
        if (CmdUtils.execInConsole(cmd) !== 0) {
            process.exit(1);
        }

        createWorkDirFileForUrl('.', url);
        GitPull.cmdGitPull({ skipMainProject: false });
    })

program
    .command('list')
    .description('List all projects')
    .action(() => {
        GitForAll.forAll('.', (projDir, proj) => {
            print(proj.name, MessageType.info);
            print(` => ${proj.url}\n`);
        });
    })

program
    .command('status')
    .description('Run "git status" for all projects')
    .action(() => {
        GitStatus.cmdStatus();
    })

program
    .command('pull')
    .description('Update all projects to the latest status. Similar with "git pull --ff-only"')
    .action(() => {
        GitPull.cmdGitPull();
    })

program
    .command('checkout [BRANCH_NAME]')
    .description('Run "git checkout BRANCH_NAME" for all projects.'
        + 'If a subproject doesn\'t have it, fallback to the same branch as the main project.')
    .action((branchName: string) => {
        console.log("error: Not implemented!");
    })

program
    .command('checkout-info <FILE>')
    .description('Checkout to branches specified in a .gitinfo file')
    .action((file: string) => {
        const switcher = new GitSwitcher();
        switcher.switchWithGitInfoFile(file);
    })


program
    .command('forall <COMMAND>')
    .description('Run a command on all projects')
    .action((command: string) => {
        GitForAll.cmdGitForAll(command);
    })

program.parse(process.argv);

