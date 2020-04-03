import chai from 'chai';
import { CmdUtils, CmdResult } from "./cmd_utils";
import fs from 'fs'

const expect = chai.expect;

describe('CmdUtils', () => {

    describe('createDeepDir', () => {
        it('should create deep dir', () => {
            const path = 'assets/deepdir/sub';
            CmdUtils.createDeepDir(path);
            expect(fs.existsSync(path)).to.be.true;
        });        
    });

    describe('exec', () => {
        it('if run successfully, it should return stdout', () => {
            const result = CmdUtils.exec('git status');
            expect(result.stdout).not.empty;
            expect(result.stderr).to.be.empty;
            expect(result.exitCode).equals(0);
        });

        it('if run unsuccessfully, it should return stdout, stderr and exit code', () => {
            const result = CmdUtils.exec('git checkout blarblarxxx');
            expect(result.stdout).to.be.empty;
            expect(result.stderr).not.empty;
            expect(result.exitCode).not.equals(0);
        });

    });

    describe('execAsync', () => {
        it('if should support callback', (done) => {
            const result = CmdUtils.execAsync('git status', (result) => {
                expect(result.stdout).not.empty;
                expect(result.stderr).to.be.empty;
                expect(result.exitCode).equals(0);
                done();
            });
        });

        it('if should support "await"', async () => {
            const result: CmdResult = await CmdUtils.execAsync('git status');

            expect(result.stdout).not.empty;
            expect(result.stderr).to.be.empty;
            expect(result.exitCode).equals(0);
        });

        it('if should support then()', async () => {
            CmdUtils.execAsync('git status').then((result) => {
                expect(result.stdout).not.empty;
                expect(result.stderr).to.be.empty;
                expect(result.exitCode).equals(0);
            })
        });
    });
});
