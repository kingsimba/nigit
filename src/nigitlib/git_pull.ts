import { GitForAll } from "./git_forall";
import { CmdUtils, println, print, MessageType } from "./cmd_utils";
import { FileDownloader } from "./file_downloader";
import fs from 'fs'
import { GitProject } from "./git_config";

export class GitPullOptions {
    skipMainProject = false;
}

export class GitPull {
    static async cmdGitPull(options?: GitPullOptions): Promise<number> {
        let forall = GitForAll.instance('.');
        if (forall == undefined) {
            return 1;
        }

        // We need to update the main project first before all others.
        // So that nigit.json is update-to-date
        const mainProject = forall.mainProject;

        // write .nigit.workspace if not exist
        GitForAll.createWorkspaceFile(`${mainProject.directory}/..`, mainProject.name);

        if (options == undefined || !options.skipMainProject) {
            println(`=== ${mainProject.name} ===`);
            const cmd = `cd "${mainProject.directory}" && git pull --ff-only`;
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
        if (forall === null) {
            return 1;
        }

        // because "git pull --ff-only" is a slow operation.
        // we'd like to run them in parallel for all projects.
        const promises: Promise<number>[] = [];
        for (const [i, proj] of forall.subprojects.entries()) {
            const projDir = proj.directory;
            const p = new Promise<number>(async (resolve) => {
                if (fs.existsSync(`${projDir}/.git`)) {
                    // for git repository, run 'git pull'
                    const cmd = `cd "${projDir}" && git pull --ff-only`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                    } else {
                        CmdUtils.printCommandError(cmd, result.stderr);
                    }

                    resolve(result.exitCode);
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

                    resolve(result.exitCode);
                } else {
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
                    }

                    println(`=== ${proj.name} ===`);
                    println(message);
                    resolve(0);
                }
            });

            promises.push(p);
        }

        // wait for all commands to complete
        const results = await Promise.all(promises);

        return 0;
    }
}
