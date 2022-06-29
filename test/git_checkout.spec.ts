import { GitCheckout, getCurrentBranchFromOutput } from '../src/nigitlib/git_checkout';
import chai from 'chai';
import { CmdUtils } from '../src/nigitlib/cmd_utils';
import fs from 'fs';
import { GitPull, GitPullOptions } from '../src/nigitlib/git_pull';

const expect = chai.expect;

describe('GitCheckout', function () {
    before(async () => {
        if (process.env.GITHUB_WORKSPACE != undefined) {
            // download dependent projects with GitHub CI
            await GitPull.cmdGitPullOrFetch([], 'pull', new GitPullOptions(true));
        }
        // delete test branch
        CmdUtils.exec('cd ../json-script && git checkout master --force && git branch -D test_branch');
        // create test branch from master
        CmdUtils.exec('cd ../json-script && git checkout -b test_branch');
        // remove README.rst
        fs.unlinkSync('../json-script/README.rst');
        CmdUtils.exec('cd ../json-script && git add README.rst && git commit -m"delete README.rst"');
    });

    it('getCurrentBranchFromOutput() works', () => {
        let result = getCurrentBranchFromOutput(
            `* (HEAD detached at origin/dev)\n  branches/1.0.x\n  branches/stable\n  dev  \n  master`
        );
        expect(result).equals('origin/dev');

        result = getCurrentBranchFromOutput(`  branches/1.0.x\n  branches/stable\n  dev  \n* master`);
        expect(result).equals('master');
    });

    it('should be able to checkout to specific branch', () => {
        const o = new GitCheckout();
        const result = o._checkout('../json-script', 'test_branch');
        expect(result.succ).is.true;
    });

    it('should fail if branch does not exist', () => {
        const o = new GitCheckout();
        const result = o._checkout('../json-script', 'origin/nonExistBranch');
        expect(result.succ).is.false;
    });

    it('should throw if local changes will be discarded', () => {
        if (process.env.GITHUB_WORKSPACE != undefined) {
            // skip this test on GitHub CI
            this.ctx.skip();
        }

        const o = new GitCheckout();
        // create json-script/README.rst
        CmdUtils.exec('cd ../json-script && git checkout test_branch --force && echo abc>> ../json-script/README.rst');
        expect(fs.readFileSync('../json-script/README.rst', 'utf8').trim()).endsWith('abc');

        // checkout to master will overwrite README.rst. So it will fail
        expect(() => {
            o._checkout('../json-script', 'master');
        }).to.throw('untracked working tree files would be overwritten');
    });

    it('should succ if forced checkout', () => {
        const o = new GitCheckout();
        // create json-script/README.rst
        CmdUtils.exec('cd ../json-script && git checkout test_branch --force && echo abc>> ../json-script/README.rst');
        expect(fs.readFileSync('../json-script/README.rst', 'utf8').trim()).endsWith('abc');

        // force checkout will overwrite the modified README.rst
        o.setOptions({ force: true });
        expect(o._checkout('../json-script', 'master').succ).is.true;
    });
});
