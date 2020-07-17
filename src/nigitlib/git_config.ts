import fs from 'fs';
import { CmdUtils, println } from './cmd_utils';

interface GitProjectJsonNode {
    name?: string;
    projectName?: string;   // compatible with old ncgit.json
    url: string;
}

export class GitProject {
    public name!: string;
    public url!: string;
    public directory!: string;

    static instanceWithUrl(url: string): GitProject {
        const o = new GitProject();
        o.url = url;
        const m = url.match(/\/([^\/]+)\.(zip|git)$/);
        o.name = m![1];
        return o;
    }

    static instanceWithJson(node: GitProjectJsonNode) {
        const o = GitProject.instanceWithUrl(node.url);
        if (node.name) {
            o!.name = node.name;
        } else if (node.projectName) {
            o!.name = node.projectName;
        }
        return o;
    }

    isGitRepository(): boolean {
        return !this.url.endsWith('.zip');
    }
}

/**
 * Used to parse 'nigit.json'
 *
 * The file looks like:
 *
 * ```json
 *     {
 *         "projects": [
 *             {
 *                 "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git"
 *             }
 *         ]
 *     }
 * ```
 */
export class GitConfig {
    public projects: GitProject[] = [];

    static instanceWithMainProjectPath(path: string): GitConfig | null {
        const o = new GitConfig()
        try {
            o._loadMainProject(path);
            o._loadSubprojects(path);
        } catch (error) {
            println(`error: ${error}`);
            return null;
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

        this.projects.push(GitProject.instanceWithUrl(m[1]));
    }

    _loadSubprojects(path: string) {
        // load subprojects
        let text: string = "";
        let nigitFileName;
        if (fs.existsSync(`${path}/nigit.json`)) {
            nigitFileName = `${path}/nigit.json`;
        } else if (fs.existsSync(`${path}/ncgit.json`)) {
            nigitFileName = `${path}/ncgit.json`;
        } else {
            throw new Error(`${path}/nigit.json is not found`);
        }

        try {
            text = fs.readFileSync(nigitFileName, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load ${path}/nigit.json`);
        }

        try {
            const rootNode = JSON.parse(text);
            this._parseSubprojects(rootNode);
        } catch (error) {
            throw new Error(`Failed to parse ${path}/nigit.json: ${error}`);
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
