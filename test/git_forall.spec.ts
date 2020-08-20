import { GitForAll as GitForAll } from "../src/nigitlib/git_forall";
import chai from 'chai';
import chai_string from "chai-string";

chai.use(chai_string);

const expect = chai.expect;

describe('GitForAll', () => {
    it('should execute command for all git projects', () => {
        const o = GitForAll.instance('.');
        const names: string[] = o!.projects.map(proj => proj.name);
        expect(names.join(' ')).equals('nigit json-script express-typescript-mocha-vscode ncgeo zlib');
    });

    it('should return existing git projects', () => {
        const o = GitForAll.instance('.');
        const names: string[] = o!.exitingGitProjects.map(proj => proj.name);
        expect(names.join(' ')).equals('nigit json-script express-typescript-mocha-vscode ncgeo');
    });

    it('should find main project and sub-projects', () => {
        const o = GitForAll.instance('.');
        expect(o!.mainProject.name).equals('nigit');
        expect(o!.mainProject.directory).endsWith('nigit');

        const names: string[] = o!.subprojects.map(proj => proj.name);
        expect(names.join(' ')).equals('json-script express-typescript-mocha-vscode ncgeo zlib');
    });

    it('should return nigit.json in root dir', () => {
        GitForAll.createWorkspaceFile('..', 'nigit');
        const o = new GitForAll();
        expect(o.findMainProject('..')).equals('../nigit');
    });

    it('should return nigit.json even in subfolder', () => {
        const o = new GitForAll();
        expect(o.findMainProject('src/nigitlib')).equals('.');
    });

    it('should return undefined if nigit.json is not found', () => {
        const o = new GitForAll();
        expect(o.findMainProject('../..')).is.undefined;
    });
});
