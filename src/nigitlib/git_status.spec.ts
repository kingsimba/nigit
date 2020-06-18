import { GitStatus } from "./git_status";
import chai from 'chai';
import colors from 'colors';

const expect = chai.expect;

describe('GitStatus', () => {
    it('should be able to filter git status log', () => {
        const log = `On branch master
Your branch is up to date with 'origin/master'.

Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

    new file:   src/a.txt
Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git checkout -- <file>..." to discard changes in working directory)

    modified:   test-data/ev/v3/lane/1-2.png
    deleted:    guidance.sln

Untracked files:
    (use "git add <file>..." to include in what will be committed)

    a.py
    ite_win32.zip

no changes added to commit (use "git add" and/or "git commit -a")`;

        const result = [
            colors.green('+ src/a.txt'),
            'M test-data/ev/v3/lane/1-2.png',
            colors.red('- guidance.sln'),
            colors.grey('? a.py'),
            colors.grey('? ite_win32.zip'),
        ];

        expect(GitStatus._filterOutput(log)).deep.equals(result);

    });
});