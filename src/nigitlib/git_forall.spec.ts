import { GitForAll as GitForAll } from "./git_forall";
import chai from 'chai';
import chai_string from "chai-string";

chai.use(chai_string);

const expect = chai.expect;

describe('GitForAll', () => {
    it('should execute command for all git projects', () => {
        const commands : string[] = [];
        GitForAll.forAll('assets/workdir', (projDir, proj) => {
            commands.push(`${proj.name}`);
            expect(projDir).endsWith(`assets/workdir/${proj.name}`);
        });
        expect(commands.join(' ')).equals('nigit cq_stdlib mapdal navicore-lib');
    });

    it('should return ncgit.json in root dir', () => {
        expect(GitForAll._findMainProject('assets/workdir')).equals('assets/workdir/navicore');
    });

    it('should return ncgit.json in specified dir', () => {
        expect(GitForAll._findMainProject('assets/workdir/navicore')).equals('assets/workdir/navicore');
    });

    it('should return ncgit.json even in subfolder', () => {
        expect(GitForAll._findMainProject('assets/workdir/navicore/subdir')).equals('assets/workdir/navicore');
    });

    it('should return undefined if ncgit.json is not found', () => {
        expect(GitForAll._findMainProject('../..')).is.undefined;
    });
});
