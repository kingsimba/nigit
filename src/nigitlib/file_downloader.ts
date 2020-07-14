import fs from 'fs';
import axios from "axios";
import { println, CmdUtils } from "./cmd_utils";
import AdmZip from 'adm-zip';
import path from 'path';

export class FileDownloader {

    /**
     * Download a file
     * @param url URL like http://path/to/file.zip
     * @param fileName local file name
     * @remarks
     *     Return 0 if the file is already up-to-date and there is no need to download it again.
     */
    static async downloadFile(url: string, fileName: string): Promise<any> {
        // compare the Last-Modified header with file's mtime
        let fileDate: number = null;
        let urlDate: number = null;

        if (fs.existsSync(fileName)) {
            fileDate = fs.statSync(fileName).mtime.getTime();
        }

        const header = await axios.head(url);
        const lastModified = header.headers['last-modified'];

        if (lastModified) {
            urlDate = Date.parse(lastModified);
        }

        if (fileDate != null && urlDate != null && fileDate >= urlDate) {
            return new Promise((resolve, reject) => {
                resolve(0);
            });
        }

        const writer = fs.createWriteStream(fileName)

        const response = await axios.get(url, {
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    }

    static extractZipInPlace(zipFile: string, folder: string): boolean {
        try {
            const fullPath = path.resolve(folder);
            CmdUtils.createDeepDir(fullPath);

            const zip = new AdmZip(zipFile);
            const entries = zip.getEntries();

            // the zip contains a single folder, move things outside.
            const fileName = path.basename(zipFile);
            const soleFolderName = fileName.substr(0, fileName.length - 4); // remove ".zip"

            const soleFolderNameWithSlash = soleFolderName + '/';
            for (const entry of entries) {
                if (!entry.entryName.startsWith(soleFolderNameWithSlash)) {
                    println(`error: there must be a single folder "${soleFolderName}" in ${zipFile}`);
                    return false;
                }
            }

            for (const entry of entries) {
                if (entry.isDirectory) {
                    const relativePath = entry.entryName.substr(soleFolderNameWithSlash.length); // remove top level folder
                    CmdUtils.createDeepDir(`${folder}/${relativePath}`);
                } else {
                    let relativePath = path.dirname(entry.entryName);
                    relativePath = relativePath.substr(soleFolderNameWithSlash.length); // remove top level folder

                    if (!zip.extractEntryTo(entry.entryName, `${folder}/${relativePath}`, false, true)) {
                        println(`error: failed to extract file ${entry.entryName}`);
                        return false;
                    }
                }
            }
        } catch (err) {
            // handle any errors
            println('error: failed to extract zip file');
            println(err);
        }
        return true;
    }
}
