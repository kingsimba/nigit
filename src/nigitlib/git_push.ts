import { GitForAll } from './git_forall';
import { CmdUtils, println, print, CmdResult } from './cmd_utils';
import fs from 'fs';
import async from 'async';
import { GitProject } from './git_config';

export async function getCurrentBranch(projDir: string): Promise<CmdResult> {
    const cmd = `cd "${projDir}" && git rev-parse --abbrev-ref HEAD`;
    const result = await CmdUtils.execAsync(cmd);
    return result;
}

export class GitPush {
    /**
     * @param projects If it's empty, push all projects.
     *        Arguments that don't match a project name are treated as tag names.
     */
    static async cmdGitPush(projects: string[]): Promise<number> {
        const forall = GitForAll.instance('.');

        const isTagPush =
            projects.length > 0 && !projects.every((o) => forall.projectWithName(o) != null);
        if (isTagPush) {
            return GitPush.cmdGitPushTags(forall, projects);
        }
        return GitPush.cmdGitPushBranches(forall, projects);
    }

    private static async cmdGitPushBranches(
        forall: GitForAll,
        projects: string[]
    ): Promise<number> {
        // filter unwanted projects
        const targetProjects = forall.projects.filter(
            (o) => projects == undefined || projects.length == 0 || projects.indexOf(o.name) != -1
        );

        // Because "git push" is a slow operation,
        // we'd like to run them in parallel for all projects.
        // "asyncify" must be used in TypeScript. See https://stackoverflow.com/questions/45572743/how-to-enable-async-maplimit-to-work-with-typescript-async-await
        const allResults = await async.mapLimit<GitProject, number>(
            targetProjects,
            5,
            async.asyncify(async (proj: GitProject) => {
                const projDir = proj.directory;
                if (fs.existsSync(`${projDir}/.git`)) {
                    const currentBranchResult = await getCurrentBranch(projDir);
                    if (currentBranchResult.exitCode !== 0) {
                        println(`error: Failed to get current branch of ${projDir}`);
                        return currentBranchResult.exitCode;
                    }
                    // for git repository, run 'git push'
                    const currentBranch: string = currentBranchResult.stdout.trim();
                    const cmd = `cd "${projDir}" && git push origin -u ${currentBranch}`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                    } else {
                        CmdUtils.printCommandError(cmd, result.stderr);
                    }

                    return result.exitCode;
                }
            })
        );

        // all results must be 0
        const allIsZero: boolean = allResults.find((v) => v != 0) == undefined;
        return allIsZero ? 0 : 1;
    }

    private static async cmdGitPushTags(forall: GitForAll, tags: string[]): Promise<number> {
        // Verify every project has every tag before pushing anything.
        let missing = false;
        for (const tag of tags) {
            for (const proj of forall.exitingGitProjects) {
                const result = CmdUtils.exec(`cd "${proj.directory}" && git tag -l "${tag}"`);
                if (result.exitCode != 0 || !result.stdout.split('\n').find((o) => o == tag)) {
                    println(`warning: tag '${tag}' not found in ${proj.name}`);
                    missing = true;
                }
            }
        }

        if (missing) {
            println('error: some projects do not have the tag. Push aborted.');
            return 1;
        }

        const refspecs = tags.map((t) => `refs/tags/${t}`).join(' ');
        const allResults = await async.mapLimit<GitProject, number>(
            forall.exitingGitProjects,
            5,
            async.asyncify(async (proj: GitProject) => {
                const cmd = `cd "${proj.directory}" && git push origin ${refspecs}`;
                const result = await CmdUtils.execAsync(cmd);

                println(`=== ${proj.name} ===`);
                if (result.exitCode == 0) {
                    print(result.stdout);
                } else {
                    CmdUtils.printCommandError(cmd, result.stderr);
                }

                return result.exitCode;
            })
        );

        // all results must be 0
        const allIsZero: boolean = allResults.find((v) => v != 0) == undefined;
        return allIsZero ? 0 : 1;
    }
}
