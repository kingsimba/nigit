import { GitForAll } from "./git_forall";
import { CmdUtils, CmdResult, println, print, MessageType } from "./cmd_utils";
import { FileDownloader } from "./file_downloader";
import ExtractZip from 'extract-zip'
import fs from 'fs'

export class GitPull {
    static async cmdGitPull() {

        // because "git pull --ff-only" is a slow operation.
        // we'd like to run them in parallel for all projects.
        const promises: Promise<number>[] = [];

        GitForAll.forAll('.', (projDir, proj) => {

            const p = new Promise<number>(async (resolve) => {

                if (fs.existsSync(`${projDir}/.git`)) {
                    // for git repository, run 'git pull'
                    const result = await CmdUtils.execAsync(`cd ${projDir} & git pull --ff-only`);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        print(result.stdout);
                    } else {
                        print(result.stderr, MessageType.error);
                    }

                    resolve(result.exitCode);
                }
                else if (proj.isGitRepository()) {
                    // for empty git repository, run 'git clone'
                    const result = await CmdUtils.execAsync(`cd ${projDir}/.. & git clone ${proj.url}`);

                    println(`=== ${proj.name} ===`);
                    if (result.exitCode == 0) {
                        println(`Git repository cloned: ${proj.url}`);
                    } else {
                        println(`warning: failed to clone ${proj.url}`);
                    }

                    resolve(result.exitCode);
                } else {
                    // for zip file, download and then unzip
                    CmdUtils.createDeepDir(projDir);

                    const fileName = proj.url.substr(proj.url.lastIndexOf('/') + 1);
                    const zipFileName = `${projDir}/${fileName}`;
                    const result = await FileDownloader.downloadFile(proj.url, zipFileName);
                    if (result == 0) {
                        println(`=== ${proj.name} ===`);
                        println('The file is up-to-date');
                    }
                    else {
                        await this.extranceZipInPlace(zipFileName, projDir + "/..");
                        println(`=== ${proj.name} ===`);
                        println(`Files extracted: ${zipFileName}`);
                    }
                    resolve(0);
                }
            });

            promises.push(p);
        });

        // wait for all commands to complete
        const results = await Promise.all(promises);
    }

    static async extranceZipInPlace(zipFile: string, folder: string) {
        try {
            await ExtractZip(zipFile, { dir: folder });
        } catch (err) {
            // handle any errors
            println('error: failed to extract zip file');
        }
    }
}
