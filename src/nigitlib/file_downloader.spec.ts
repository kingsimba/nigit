import { FileDownloader } from "./file_downloader";
import fs from 'fs';
import chai from 'chai';

const expect = chai.expect;

describe('FileDownloader', () => {
    const fileName = 'baidu.ico';

    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
    }

    it('can download file and avoid redownload with Last-Modified', async () => {
        const result = await FileDownloader.downloadFile('https://www.baidu.com/favicon.ico', fileName);
        expect(result).not.equals(0);
        expect(fs.existsSync(fileName)).to.be.true;
        expect(fs.statSync(fileName).size).greaterThan(100);

        const result2 = await FileDownloader.downloadFile('https://www.baidu.com/favicon.ico', fileName);
        expect(result2).equals(0);
    });
});
