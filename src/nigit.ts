#!/usr/bin/env node
import program from 'commander';
import process from 'process';
import { GitSwitcher } from "./nigitlib/git_switcher";
import { GitForAll } from './nigitlib/git_forall';
import { println, print, MessageType, CmdUtils } from './nigitlib/cmd_utils';
import { GitStatus } from './nigitlib/git_status';
import { GitPull } from './nigitlib/git_pull';
import { GitProject } from './nigitlib/git_config';
import { GitCheckout, GitCheckoutOptions } from './nigitlib/git_checkout';
import { gitBranch } from './nigitlib/git_branch';
import { GitStart } from './nigitlib/git_start';
import { GitTag } from './nigitlib/git_tag';
import { GitClean, GitCleanOption } from './nigitlib/git_clean';

program
    .command('clone <URL>')
    .description('Clone a main project and all its subprojects')
    .action((url: string) => {
        const cmd = `git clone ${url}`;
        println('> ' + cmd);
        if (CmdUtils.execInConsole(cmd) !== 0) {
            process.exit(1);
        }

        const proj = GitProject.instanceWithUrl(url);
        GitForAll.createWorkspaceFile('.', proj.name);
        GitPull.cmdGitPull([], { skipMainProject: false });
    });

program
    .command('list')
    .description('List all projects')
    .action(() => {
        GitForAll.forAll('.', (projDir, proj) => {
            print(proj.name, MessageType.info);
            print(` => ${proj.url}\n`);
        });
    });

program
    .command('status')
    .description('Run "git status" for all projects')
    .action(() => {
        GitStatus.cmdStatus();
    });

program
    .command('branch')
    .description('Show branch information')
    .option('--all', 'Show all branches.')
    .option('-f, --features', 'Also show all feature branches.')
    .action((options: any) => {
        gitBranch.execute(options);
    });

program
    .command('tag')
    .description('management of tags')
    .option('-l, --list <PATTERN>', 'show tags')
    .option('-c, --create [NAME]>', 'create a tag')
    .action((options: any) => {
        if (options.list) {
            GitTag.cmdListTags(options.list);
        } else if (options.create) {
            GitTag.cmdCreateTag(options.create);
        }
    });

program
    .command('pull [projects...]')
    .description('Update all projects to the latest status. Similar with "git pull --ff-only"')
    .option('--skip-main', 'Skip the main project', false)
    .action((projects: string[], options: any) => {
        GitPull.cmdGitPull(projects, { skipMainProject: options.skipMain });
    });

program
    .command('start <branch> [projects...]')
    .description('create branch for projects')
    .action((branch: string, projects: string[]) => {
        GitStart.cmdStart(branch, projects);
    });

program
    .command('clean')
    .description('remove untracked files')
    .option('-f, --force', 'Use this option to confirm the cleaning')
    .option('-n, --dry', 'Dry run')
    .action((options: GitCleanOption) => {
        GitClean.cmdClean(options);
    });

program
    .command('checkout <BRANCH_NAME>')
    .description('Run "git checkout BRANCH_NAME" for all projects.'
        + 'If a subproject doesn\'t have it, fallback to the same branch as the main project.')
    .option('--force', 'Discard local modifications')
    .action((branchName: string, options: GitCheckoutOptions) => {
        const o = new GitCheckout();
        o.cmdCheckout(branchName, options);
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

