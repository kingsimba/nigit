import fs from 'fs';
import { CmdUtils, println } from './cmd_utils';

export class GitProject {
    public name: string;

    constructor(public url: string) {
        const m = url.match(/\/([^\/]+)\.(zip|git)$/);
        this.name = m[1];
    }

    static instanceWithJson(node: any) {
        return new GitProject(node.url);
    }

    isGitRepository(): boolean {
        return !this.url.endsWith('.zip');
    }
}

/**
    Used to parse 'ncgit.json'

    @remarks
        the file looks like:

        {
            "projects": [
                {
                    "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git"
                }, 
            ]
        }
*/
export class GitConfig {
    public projects: GitProject[] = [];

    static instanceWithMainProjectPath(path: string): GitConfig {
        var o = new GitConfig()
        try {
            o._loadMainProject(path);
            o._loadSubprojects(path);
        } catch (error) {
            println(`error: ${error}`);
            return undefined;
        }

        return o;
    }

    _loadMainProject(path: string) {
        // load main project
        const result = CmdUtils.exec(`cd ${path} & git remote -v`);
        if (result.exitCode != 0) {
            throw new Error(`failed to load the main project ${path}`);
        }
        const m = result.stdout.match(/origin\s+(.*)\s+\(fetch\)/);
        if (m == undefined) {
            throw new Error('failed parse main project remote URL');
        }

        this.projects.push(new GitProject(m[1]));
    }

    _loadSubprojects(path: string) {
        // load subprojects
        var text: string = "";
        try {
            text = fs.readFileSync(`${path}/ncgit.json`, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load ${path}/ncgit.json`);
        }

        try {
            const rootNode = JSON.parse(text);
            this._parseSubprojects(rootNode);
        } catch (error) {
            throw new Error(`Failed to parse ${path}/ncgit.json: ${error}`);
        }
    }

    _parseSubprojects(rootNode: any) {
        if (rootNode == null) {
            throw new Error('rootNode is null')
        }

        // load json file for sub-projects
        if (rootNode.projects) {
            rootNode.projects.forEach((node: any) => {
                this.projects.push(GitProject.instanceWithJson(node));
            });
        }
    }
}
