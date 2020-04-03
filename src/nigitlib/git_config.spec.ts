import { GitConfig, GitProject } from "./git_config";
import chai from 'chai';

const expect = chai.expect;

describe('GitProject', () => {
    it('can be created from json node', () => {
        const proj = GitProject.instanceWithJson({
            "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git",
            "projectName": "cq_stdlib",
            "branch": "master"
        });
        expect(proj).not.null;
        expect(proj.name).equals('cq_stdlib');
        expect(proj.url).equals('git@gitlab.mapbar.com:nc/cq_stdlib.git');
        expect(proj.branch).equals('master');
    });
});

describe('GitConfig', () => {
    it('can be created from json node', () => {
        const cfg = GitConfig.instanceWithJson({
            "branch": "master",
            "projects": [
                {
                    "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git",
                    "projectName": "cq_stdlib",
                    "branch": "master"
                },
                {
                    "url": "git@gitlab.mapbar.com:nc/mapdal.git",
                    "projectName": "mapdal",
                    "branch": "master"
                },
                {
                    "url": "git@gitlab.mapbar.com:nc/dalr.git",
                    "projectName": "dalr",
                    "branch": "master"
                }
            ]
        });
        expect(cfg).not.null;
        expect(cfg.projects).to.have.lengthOf(3);
        expect(cfg.projects[1].name).equals('mapdal');
    });
});
