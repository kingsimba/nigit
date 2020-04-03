import chai from "chai";
import { GitSwitcher, GitInfo } from "./git_switcher";

const expect = chai.expect;

describe('GitSwitcher', () => {

    const o = new GitSwitcher();
    it('should parse git file successfully', () => {
        const text = o._loadTextFile('assets/sample_git.info');
        const infos = o._parseGitInfo(text);
        expect(infos).to.be.an('Array')
            .and.have.length.greaterThan(10)
            .and.deep.contains(new GitInfo('dalr', '44522e3'))
            .and.deep.contains(new GitInfo('3rd-party', 'f5f53e7'));
    });

    it('should return null if file does not exist', () => {
        expect(o._loadTextFile('none-exist.info')).equals(undefined);
    });

});