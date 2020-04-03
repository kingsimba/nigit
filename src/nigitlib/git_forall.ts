import { GitProject, GitConfig } from "./git_config";
import fs from 'fs';
import { CmdUtils, println } from "./cmd_utils";
import { resolve } from "path";

export class GitForall {

    /**
     * Execute the same command for all projects. in current directory
     */
    static cmdGitForall(command: string): number {
        this.forall('.', (projDir, proj) => {
            println(`=== ${proj.name} ===`);
            if (proj.isGitRepository()) {
                CmdUtils.execInConsole(`cd ${projDir} & ${command}`);
            } else {
                println('warning: not a git repository. skipped');
            }
        })

        return 0;
    }

    /**
     * Execute the same command for all projects. It will try to find ncgit.json in |workDir| directory.
     */
    static forall(workDir: string, callback: (projDir: string, proj: GitProject) => void): number {
        let ncgitJson = this._findGitConfigFile(workDir);
        if (!ncgitJson) {
            console.error('error: failed to locate ncgit.json');
            return -1;
        }

        ncgitJson = resolve(ncgitJson).replace(/\\/g, '/');
        const config = GitConfig.instanceWithConfigFile(ncgitJson);

        const workspaceDir = ncgitJson.split('/').slice(0, -2).join('/');

        config.projects.forEach(proj => {
            const projDir = `${workspaceDir}/${proj.name}`;
            callback(projDir, proj);
        });

        return 0;
    }

    /**
     * Find the 'ncgit.json' file.
     * @param rootDir the root directory to search for `ncgit.json`
     */
    static _findGitConfigFile(rootDir: string): string {

        // search in the root dir
        var tryFile = `${rootDir}/ncgit.json`;
        if (fs.existsSync(tryFile)) {
            return tryFile;
        }
        else {
            // find "ncgit.workspace" and read its "master_project" node.
            tryFile = `${rootDir}/ncgit.workspace`;
            if (fs.existsSync(tryFile)) {
                const text = fs.readFileSync(tryFile, 'utf8');
                const node = JSON.parse(text);
                if (node && node.master_project) {
                    tryFile = `${rootDir}/${node.master_project}/ncgit.json`;
                    if (fs.existsSync(tryFile)) {
                        return tryFile;
                    }
                }
            }
        }

        return null;
    }
}