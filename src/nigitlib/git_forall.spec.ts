import { GitForall } from "./git_forall";
import chai from 'chai';
import chai_string from "chai-string";

chai.use(chai_string);

const expect = chai.expect;

describe('GitForall', () => {
    it('should execute command for all git projects', () => {
        const commands : string[] = [];
        GitForall.forall('assets/workdir', (projDir, proj) => {
            commands.push(`${proj.name}`);
            expect(projDir).endsWith(`assets/workdir/${proj.name}`);
        });
        expect(commands.join(' ')).equals('cq_stdlib mapdal navicore-lib');
    });

    it('should return ncgit.json in specified dir', () => {
        expect(GitForall._findGitConfigFile('assets/workdir/navicore')).equals('assets/workdir/navicore/ncgit.json');
    });

    it('should return ncgit.json in root dir', () => {
        expect(GitForall._findGitConfigFile('assets/workdir')).equals('assets/workdir/navicore/ncgit.json');
    });

    it('should return null if ncgit.json is not found', () => {
        expect(GitForall._findGitConfigFile('assets')).is.null;
    });
});
