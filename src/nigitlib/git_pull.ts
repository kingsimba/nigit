import { GitForAll } from './git_forall';
import { CmdUtils, println, print, MessageType } from './cmd_utils';
import { FileDownloader } from './file_downloader';
import fs from 'fs';
import async from 'async';
import { GitProject } from './git_config';

export class GitPullOptions {
    skipMainProject = false;
    prune = false;
}

export class GitPull {
    /**
     * @param projects If it's empty, pull all projects.
     */
    static async cmdGitPullOrFetch(
        projects: string[],
        action: 'pull' | 'fetch',
        options?: GitPullOptions
    ): Promise<number> {
        let forall = GitForAll.instance('.');

        // We need to update the main project first before all others.
        // So that nigit.json is update-to-date
        const mainProject = forall.mainProject;

        // write .nigit.workspace if not exist
        GitForAll.createWorkspaceFile(`${mainProject.directory}/..`, mainProject.name);

        const pruneArg = options?.prune ? '--prune' : '';
        const gitCmd = action == 'pull' ? `git pull --ff-only` : `git fetch ${pruneArg}`;

        if (
            (options == undefined || !options.skipMainProject) &&
            (projects.length == 0 || projects.indexOf(mainProject.name) != -1)
        ) {
            println(`=== ${mainProject.name} ===`);
            let cmd = `cd "${mainProject.directory}" && ${gitCmd}`;
            const result = CmdUtils.exec(cmd);
            if (result.exitCode == 0) {
                print(result.stdout);
            } else {
                CmdUtils.printCommandError(cmd, result.stderr);
                return 1;
            }
        }

        // reload the config file. Because the main project may be updated
        forall = GitForAll.instance('.');

        // filter unwanted projects
        const targetProjects = forall.subprojects.filter(
            (o) => projects == undefined || projects.length == 0 || projects.indexOf(o.name) != -1
        );

        // Because "git pull --ff-only" is a slow operation,
        // we'd like to run them in parallel for all projects.
        // "asyncify" must be used in TypeScript. See https://stackoverflow.com/questions/45572743/how-to-enable-async-maplimit-to-work-with-typescript-async-await
        let allResults = await async.mapLimit<GitProject, number>(
            targetProjects,
            5,
            async.asyncify(async (proj: GitProject) => {
                const projDir = proj.directory;
                if (fs.existsSync(`${projDir}/.git`)) {
                    // for git repository, run 'git pull/fetch'
                    let cmd = `cd "${projDir}" && ${gitCmd}`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                        if (action == 'fetch') {
                            // stderr has something like "From github.com:kingsimba/express-typescript-mocha-vscode\n - [deleted]         (none)     -> origin/try\n"
                            print(result.stderr);
                        }
                    } else {
                        CmdUtils.printCommandError(cmd, result.stderr);
                    }

                    return result.exitCode;
                } else if (proj.isGitRepository()) {
                    // for empty git repository, run 'git clone'
                    const cmd = `git clone "${proj.url}" "${projDir}"`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        println(`Git repository cloned: ${proj.url}`);
                    } else {
                        const message = result.stderr.replace(/\r?\n/g, '');
                        if (message.match(/Please make sure you have the correct access rights/)) {
                            println(`error: Failed to clone ${proj.url}.`);
                            println('Please make sure you have the correct access rights.', MessageType.weakText);
                            println('and the repository exists.', MessageType.weakText);
                        } else {
                            CmdUtils.printCommandError(cmd, result.stderr);
                        }
                    }

                    return result.exitCode;
                } else {
                    let decompressedSucc = true;
                    // for zip file, download and then unzip
                    CmdUtils.createDeepDir(projDir);

                    const fileName = proj.url.substr(proj.url.lastIndexOf('/') + 1);
                    const zipFileName = `${projDir}/${fileName}`;
                    let message;
                    try {
                        const result = await FileDownloader.downloadFile(proj.url, zipFileName);
                        if (result == 0) {
                            message = 'The file is up-to-date';
                        } else {
                            await FileDownloader.extractZipInPlace(zipFileName, projDir);
                            message = `Files extracted: ${zipFileName}`;
                        }
                    } catch (error) {
                        message = `error: ${error}`;
                        decompressedSucc = false;
                    }

                    println(`=== ${proj.name} ===`);
                    println(message);
                    return decompressedSucc ? 0 : 1;
                }
            })
        );

        // all results must be 0
        let allIsZero: boolean = allResults.find((v) => v != 0) == undefined;
        return allIsZero ? 0 : 1;
    }
}
