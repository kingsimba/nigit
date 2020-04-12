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
                if (fs.existsSync(projDir)) {
                    CmdUtils.execInConsole(`cd ${projDir} & ${command}`);
                } else {
                    println(`error: project doesn't exist: ${proj.name}. Please run 'nigit pull'?`);
                    return -1;
                }
            } else {
                println('Not a git repository. skipped.');
            }
        })

        return 0;
    }

    /**
     * Execute the same command for all projects. It will try to find nigit.json in |workDir| directory.
     */
    static forAll(workDir: string, callback: (projDir: string, proj: GitProject) => void): number {
        const mainProject = this._findMainProject(workDir);
        if (mainProject == null) {
            println('error: no nigit.json is found');
            return -1;
        }

        const config = GitConfig.instanceWithMainProjectPath(mainProject);
        if (config == undefined) {
            return -1;
        }

        const workspaceDir = mainProject === '.' ? '..' : mainProject.substr(0, mainProject.lastIndexOf('/'));

        for (const proj of config.projects) {
            const projDir = `${workspaceDir}/${proj.name}`;
            callback(projDir, proj);
        }

        return 0;
    }

    /**
     * Find the main project which contains the 'nigit.json' file.
     * @param rootDir the root directory to search for `nigit.json`
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

            // try nigit.json
            if (fs.existsSync(`${path}/nigit.json`)) {
                mainProjPath = path;
                break;
            }

            // try .nigit.workspace
            const workspaceFile = `${path}/.nigit.workspace`;
            if (fs.existsSync(workspaceFile)) {
                const text = fs.readFileSync(workspaceFile, 'utf8');
                const node = JSON.parse(text);
                if (node && node.master_project) {
                    const projFile = `${path}/${node.master_project}/nigit.json`;
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