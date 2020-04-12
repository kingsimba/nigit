import { FileDownloader } from "./file_downloader";
import fs from 'fs';
import chai from 'chai';

function removeDir(path: string) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)

        if (files.length > 0) {
            files.forEach(function (filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removeDir(path + "/" + filename)
                } else {
                    fs.unlinkSync(path + "/" + filename)
                }
            })
        } else {
            console.log("No files found in the directory.")
        }
    } else {
        console.log("Directory path not found.")
    }
}

const expect = chai.expect;

describe('FileDownloader', () => {
    const fileName = 'baidu.ico';

    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
    }

    it('can download file and avoid re-download with Last-Modified', async () => {
        const result = await FileDownloader.downloadFile('https://www.baidu.com/favicon.ico', fileName);
        expect(result).not.equals(0);
        expect(fs.existsSync(fileName)).to.be.true;
        expect(fs.statSync(fileName).size).greaterThan(100);

        const result2 = await FileDownloader.downloadFile('https://www.baidu.com/favicon.ico', fileName);
        expect(result2).equals(0);
    });

    it('can extract zip file', async () => {
        removeDir('zlib-1.2.11');
        expect(fs.existsSync('zlib-1.2.11')).is.false;
        await FileDownloader.extractZipInPlace('assets/zlib/zlib1211.zip', 'assets');
        expect(fs.existsSync('assets/zlib-1.2.11/zlib-readme.txt')).is.true;
        expect(fs.existsSync('assets/zlib-1.2.11/zlib-src')).is.true;
    });
});
