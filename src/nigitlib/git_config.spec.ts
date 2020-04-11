import { GitConfig, GitProject } from "./git_config";
import chai from 'chai';

const expect = chai.expect;

describe('GitProject', () => {
    it('instanceWithJson', () => {
        const proj = GitProject.instanceWithJson({
            "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git",
        });
        expect(proj).not.null;
        expect(proj.name).equals('cq_stdlib');
        expect(proj.url).equals('git@gitlab.mapbar.com:nc/cq_stdlib.git');
    });
});

describe('GitConfig', () => {
    it('can parse subprojects', () => {
        const cfg = new GitConfig();
        cfg._parseSubprojects({
            "projects": [
                {
                    "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git"
                }, 
                {
                    "url": "git@gitlab.mapbar.com:nc/mapdal.git"
                }, 
                {
                    "url": "http://navicore.mapbar.com/ncgit/navicore-lib.zip"
                }
            ]
        });
        expect(cfg).not.null;
        expect(cfg.projects).to.have.lengthOf(3);
        expect(cfg.projects[1].name).equals('mapdal');
        expect(cfg.projects[1].url).equals('git@gitlab.mapbar.com:nc/mapdal.git');
    });

    it('can load main project', () => {
        const cfg = new GitConfig();
        cfg._loadMainProject('.');
        expect(cfg.projects).have.lengthOf(1);
        expect(cfg.projects[0].name).equals('nigit');
        expect(cfg.projects[0].url).equals('git@github.com:kingsimba/nigit.git');
    });
});
