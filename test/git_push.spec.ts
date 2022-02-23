import { GitPush, getCurrentBranch } from '../src/nigitlib/git_push';
import chai from 'chai';
import { CmdResult } from '../src/nigitlib/cmd_utils';

const expect = chai.expect;

describe('GitPush', () => {
    it('getCurrentBranch', async () => {
        const result: CmdResult = await getCurrentBranch('.');
        expect(result.exitCode).equals(0);
        expect(result.stdout).matches(/.+\n/);
    });

    it('push project', async () => {
        const exitCode = await GitPush.cmdGitPush(['nigit']);
        expect(exitCode).equals(0);
    });
});
