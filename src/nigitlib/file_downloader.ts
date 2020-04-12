import fs from 'fs';
import axios from "axios";
import { println, CmdUtils } from "./cmd_utils";
import ExtractZip from 'extract-zip'
import { resolve } from 'path';

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

    static async extractZipInPlace(zipFile: string, folder: string) {
        try {
            const fullPath = resolve(folder);
            CmdUtils.createDeepDir(fullPath);
            await ExtractZip(zipFile, { dir: fullPath });
        } catch (err) {
            // handle any errors
            println('error: failed to extract zip file');
            println(err);
        }
    }
}
