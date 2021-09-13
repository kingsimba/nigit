import chai from "chai";
import { GitSwitcher, GitInfo } from "../src/nigitlib/git_switcher";

const expect = chai.expect;

describe('GitSwitcher', () => {

    const o = new GitSwitcher();
    it('should parse git file successfully', () => {
        const infos = o._parseGitInfo(`
nigit [master|e4cf683] Merge branch 'dump-info'
json-script [master|59046b9] Update syntax-highlight-in-sphinx.rst
express-typescript-mocha-vscode [master|279163b] Merge pull request #8 from kingsimba/dependabot/npm_and_yarn/lodash-4.17.21
ncgeo [master|9597110] Merge pull request #4 from ZhujinLi/issue#3`);
        expect(infos).to.be.an('Array');
        expect(infos.length).equals(4);
        expect(infos)
            .deep.contains(new GitInfo('ncgeo', '9597110'))
            .and.deep.contains(new GitInfo('json-script', '59046b9'));
    });

    it('should return null if file does not exist', () => {
        expect(o._loadTextFile('none-exist.info')).is.null;
    });
});
