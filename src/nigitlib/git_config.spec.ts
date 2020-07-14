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
                    "url": "git@github.com:NavInfoNC/json-script.git"
                },
                {
                    "url": "git@github.com:kingsimba/express-typescript-mocha-vscode.git"
                },
                {
                    "name": "ncgeo",
                    "url": "git@github.com:NavInfoNC/nc-geo.git"
                },
                {
                    "name": "zlib",
                    "url": "https://www.zlib.net/zlib1211.zip"
                }
            ]
        }
        );
        expect(cfg).not.null;
        expect(cfg.projects).to.have.lengthOf(4);
        expect(cfg.projects[1].name).equals('express-typescript-mocha-vscode');
        expect(cfg.projects[1].url).equals('git@github.com:kingsimba/express-typescript-mocha-vscode.git');
        expect(cfg.projects[2].name).equals('ncgeo');
        expect(cfg.projects[2].url).equals('git@github.com:NavInfoNC/nc-geo.git');
    });

    it('can load main project', () => {
        const cfg = new GitConfig();
        cfg._loadMainProject('.');
        expect(cfg.projects).have.lengthOf(1);
        expect(cfg.projects[0].name).equals('nigit');
        expect(cfg.projects[0].url).equals('git@github.com:kingsimba/nigit.git');
    });
});
