import { GitForAll } from "./git_forall";
import { CmdUtils, println, print, MessageType } from "./cmd_utils";
import { FileDownloader } from "./file_downloader";
import fs from 'fs'

export interface GitPullOptions {
    updateMainProject?: boolean;
}

export class GitPull {
    static async cmdGitPull(options?: GitPullOptions) {

        // because "git pull --ff-only" is a slow operation.
        // we'd like to run them in parallel for all projects.
        const promises: Promise<number>[] = [];
        let isFirstProject = true;

        GitForAll.forAll('.', (projDir, proj) => {

            // first project is the main project. We need to update it before all other projects.
            if (isFirstProject) {
                isFirstProject = false;

                if (options == undefined || options.updateMainProject) {
                    println(`=== ${proj.name} ===`);
                    const result = CmdUtils.exec(`cd "${projDir}" & git pull --ff-only`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                    } else {
                        print(result.stderr, MessageType.error);
                    }
                }
                return;
            }

            const p = new Promise<number>(async (resolve) => {

                if (fs.existsSync(`${projDir}/.git`)) {
                    // for git repository, run 'git pull'
                    const cmd = `cd "${projDir}" & git pull --ff-only`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                    } else {
                        println(`error: Failed to execute command`);
                        println(`> ${cmd}`);
                        print(result.stderr, MessageType.error);
                    }

                    resolve(result.exitCode);
                }
                else if (proj.isGitRepository()) {
                    // for empty git repository, run 'git clone'
                    const cmd = `mkdir "${projDir}" & cd "${projDir}" & git clone "${proj.url}" .`;
                    const result = await CmdUtils.execAsync(cmd);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        println(`Git repository cloned: ${proj.url}`);
                    } else {
                        println(`error: failed to clone ${proj.url}.`);
                        println(`> ${cmd}`);
                        print(result.stderr);
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
                            await FileDownloader.extractZipInPlace(zipFileName, projDir + "/..");
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
        });

        // wait for all commands to complete
        const results = await Promise.all(promises);
    }
}
