import { GitProject, GitConfig } from "./git_config";
import fs from 'fs';
import { CmdUtils, println } from "./cmd_utils";
import { normalize, relative } from "path";
import { resolve } from "path";

export class GitForAll {

    /**
     * Execute the same command for all projects. in current directory
     */
    static cmdGitForAll(command: string): number {
        this.forAll('.', (projDir, proj) => {
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
    static forAll(workDir: string, callback: (projDir: string, proj: GitProject) => void): number {
        const mainProject = this._findMainProject(workDir);
        if (mainProject == null) {
            println('error: no ncgit.json is found');
            return -1;
        }

        const config = GitConfig.instanceWithMainProjectPath(mainProject);
        if (config == undefined) {
            return -1;
        }

        const workspaceDir = mainProject.substr(0, mainProject.lastIndexOf('/'));

        for (const proj of config.projects) {
            const projDir = (workspaceDir == '') ? proj.name : `${workspaceDir}/${proj.name}`;
            callback(projDir, proj);
        }

        return 0;
    }

    /**
     * Find the main project which contains the 'ncgit.json' file.
     * @param rootDir the root directory to search for `ncgit.json`
     */
    static _findMainProject(rootDir: string): string {

        let mainProjPath = undefined;
        let path = rootDir;
        let lastCheckedPath;
        while (fs.existsSync(path)) {

            // prevent dead loop over root path like 'C:\'
            const fullPath = resolve(path);
            if (fullPath === lastCheckedPath)
                break;
            lastCheckedPath = fullPath;

            // try ncgit.json
            if (fs.existsSync(`${path}/ncgit.json`)) {
                mainProjPath = path;
                break;
            }

            // try ncgit.workspace
            const workspaceFile = `${path}/ncgit.workspace`;
            if (fs.existsSync(workspaceFile)) {
                const text = fs.readFileSync(workspaceFile, 'utf8');
                const node = JSON.parse(text);
                if (node && node.master_project) {
                    const projFile = `${path}/${node.master_project}/ncgit.json`;
                    if (fs.existsSync(projFile)) {
                        mainProjPath = `${path}/${node.master_project}`;
                    }
                }
                break;
            }

            path = path + '/..';
        }

        if (mainProjPath != undefined) {
            const rel = relative(rootDir, mainProjPath);
            if (rel !== '') {
                mainProjPath = rootDir + '/' + rel;
            } else {
                mainProjPath = rootDir;
            }
            mainProjPath = normalize(mainProjPath).replace(/\\/g, '/');
        }

        return mainProjPath;
    }

}