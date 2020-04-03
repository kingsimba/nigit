import fs from 'fs';

export class GitProject {
    isGitRepository() : boolean {
        return !this.url.endsWith('.zip');
    }
    
    constructor(public name: string, public url: string, public branch: string) { }

    static instanceWithJson(node: any) {
        return new GitProject(node.projectName, node.url, node.branch);
    }
}

/**
    Used to parse 'ncgit.json'

    @remarks
        the file looks like:

        {
            "branch": "master",
            "projects": [
                {
                    "url": "git@gitlab.mapbar.com:nc/cq_stdlib.git", 
                    "projectName": "cq_stdlib", 
                    "branch": "master"
                }, 
            ]
        }
*/
export class GitConfig {
    public projects : GitProject[] = [];

    static instanceWithConfigFile(fileName: string): GitConfig {
        var text: string = "";
        try {
            text = fs.readFileSync(fileName, 'utf8');
        } catch (error) {
            return null;
        }

        const root = JSON.parse(text);

        return this.instanceWithJson(root);
    }

    static instanceWithJson(root: any) : GitConfig {
        if (root == null) {
            return null;
        }

        var o = new GitConfig()
        o.projects = [];
        if (root.projects) {
            root.projects.forEach((node: any) => {
                o.projects.push(GitProject.instanceWithJson(node));                
            });
        }

        return o;
    }
}