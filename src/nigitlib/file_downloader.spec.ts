import { FileDownloader } from "./file_downloader";
import fs from 'fs';
import chai from 'chai';
import { CmdUtils } from "./cmd_utils";

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
        CmdUtils.deleteFolderRecursive('assets/zlib/zlib-src');
        CmdUtils.deleteFileIfExists('assets/zlib/zlib-readme.txt');
        expect(fs.existsSync('assets/zlib/zlib-src')).is.false;
        expect(fs.existsSync('assets/zlib/zlib-readme.txt')).is.false;

        await FileDownloader.extractZipInPlace('assets/zlib/zlib-1.2.11.zip', 'assets/zlib');
        expect(fs.existsSync('assets/zlib/zlib-src')).is.true;
        expect(fs.existsSync('assets/zlib/zlib-readme.txt')).is.true;
    });
});
