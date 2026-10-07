import { GitCheckout, getCurrentBranchFromOutput } from '../src/nigitlib/git_checkout';
import chai from 'chai';
import { CmdUtils } from '../src/nigitlib/cmd_utils';
import fs from 'fs';
import os from 'os';
import path from 'path';
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
            '* (HEAD detached at origin/dev)\n  branches/1.0.x\n  branches/stable\n  dev  \n  master'
        );
        expect(result).equals('origin/dev');

        result = getCurrentBranchFromOutput('  branches/1.0.x\n  branches/stable\n  dev  \n* master');
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

describe('GitCheckout --no-local', () => {
    const root = path.join(os.tmpdir(), `nigit-no-local-${process.pid}-${Date.now()}`);
    const cloneA = path.join(root, 'cloneA'); // has tag v1.2.3
    const cloneB = path.join(root, 'cloneB'); // has a branch named v1.2.3 instead

    const git = (dir: string, cmd: string) => CmdUtils.exec(`cd ${dir} && git ${cmd}`);

    const hasRef = (dir: string, ref: string): boolean =>
        git(dir, `show-ref --verify --quiet ${ref}`).exitCode == 0;

    const isDetached = (dir: string): boolean =>
        git(dir, 'symbolic-ref -q HEAD').exitCode != 0;

    before(() => {
        fs.mkdirSync(root, { recursive: true });
        const seed = path.join(root, 'seed');
        const author = '-c user.email=a@b.c -c user.name=a';

        git(root, 'init -q --bare remote.git');
        git(root, 'init -q seed');
        fs.writeFileSync(path.join(seed, 'f.txt'), 'one\n');
        git(seed, 'add .');
        git(seed, `${author} commit -qm one`);
        git(seed, 'branch -M master');
        git(seed, 'tag v1.2.3');
        git(seed, 'remote add origin ../remote.git');
        git(seed, 'push -q --tags origin master');
        // remote branch that shares the tag's name
        git(seed, 'push -q origin master:refs/heads/v1.2.3');

        git(root, 'clone -q remote.git cloneA');
        git(root, 'clone -q remote.git cloneB');
        for (const dir of [cloneA, cloneB]) {
            git(dir, `${author} checkout -q --detach origin/master`);
            git(dir, 'branch -D master');
        }
        // make 'v1.2.3' only reachable as a branch in cloneB
        git(cloneB, 'tag -d v1.2.3');
    });

    after(() => {
        fs.rmdirSync(root, { recursive: true });
    });

    it('should not create a local branch when checking out a branch name', () => {
        const o = new GitCheckout();
        o.setOptions({ noLocal: true });

        expect(o._checkout(cloneA, 'master').succ).is.true;
        expect(isDetached(cloneA)).is.true;
        expect(hasRef(cloneA, 'refs/heads/master')).is.false;
    });

    it('should not create any ref when checking out a tag', () => {
        const before = git(cloneA, 'show-ref').stdout;

        const o = new GitCheckout();
        o.setOptions({ noLocal: true });

        expect(o._checkout(cloneA, 'v1.2.3').succ).is.true;
        expect(isDetached(cloneA)).is.true;
        expect(git(cloneA, 'show-ref').stdout).equals(before);
    });

    it('should fail if a tag-shaped name is a branch', () => {
        const o = new GitCheckout();
        o.setOptions({ noLocal: true });

        expect(() => o._checkout(cloneB, 'v1.2.3')).to.throw(
            /'v1\.2\.3' looks like a tag, but it is a branch/
        );
    });

    it('should return a failed result if the ref does not exist', () => {
        const o = new GitCheckout();
        o.setOptions({ noLocal: true });

        expect(o._checkout(cloneA, 'no_such_branch').succ).is.false;
    });

    it('should still create a local branch without --no-local', () => {
        const o = new GitCheckout();

        expect(o._checkout(cloneB, 'master').succ).is.true;
        expect(git(cloneB, 'symbolic-ref -q HEAD').stdout.trim()).equals(
            'refs/heads/master'
        );
    });
});
