import { GitProject, GitConfig } from "./git_config";
import fs from 'fs';
import { CmdUtils, println, print } from "./cmd_utils";
import { normalize, relative } from "path";
import { resolve } from "path";

export class GitForAll {

    static createWorkspaceFile(workspacePath: string, projName: string) {
        const filename = `${workspacePath}/.nigit.workspace`;
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify({ master_project: projName }));    
        }
    }

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
    static forAll(workDir: string, callback: (projDir: string, proj: GitProject) => void): boolean {
        let mainProject;
        try {
            mainProject = this.findMainProject(workDir);
        } catch (error) {
            println('error: ' + error);
            return false;
        }
        if (mainProject == null) {
            println('error: no nigit.json is found');
            return false;
        }

        const config = GitConfig.instanceWithMainProjectPath(mainProject);
        if (config == undefined) {
            return false;
        }

        let workspaceDir;
        if (mainProject == '.') {
            workspaceDir = '..';
        } else if (mainProject.lastIndexOf('/') !== -1) {
            workspaceDir = mainProject.substr(0, mainProject.lastIndexOf('/'));
        } else {
            workspaceDir = '.';
        }

        for (const proj of config.projects) {
            const projDir = `${workspaceDir}/${proj.name}`;
            callback(projDir, proj);
        }

        return true;
    }

    static forMainProject(workDir: string, callback: (projDir: string, proj: GitProject) => void): boolean {
        let firstProjet = true;
        return this.forAll(workDir, (projDir: string, proj: GitProject) => {
            if (firstProjet) {
                firstProjet = false;
                callback(projDir, proj);
            }
        });
    }

    static forSubprojects(workDir: string, callback: (projDir: string, proj: GitProject) => void): boolean {
        let firstProjet = true;
        return this.forAll(workDir, (projDir: string, proj: GitProject) => {
            if (firstProjet) {
                firstProjet = false;
            } else {
                callback(projDir, proj);
            }
        });
    }

    /**
     * Find the main project which contains the 'nigit.json' file.
     * @param rootDir the root directory to search for `nigit.json`
     * @return the path of the main project
     */
    static findMainProject(rootDir: string): string | undefined {

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

            // try ncgit.json. for compatibility
            if (fs.existsSync(`${path}/ncgit.json`)) {
                mainProjPath = path;
                break;
            }

            // try .nigit.workspace
            let workspaceFile = `${path}/.nigit.workspace`;
            if (!fs.existsSync(workspaceFile)) {
                // for backward compatibility
                workspaceFile = `${path}/ncgit.workspace`;
            }
            if (fs.existsSync(workspaceFile)) {
                try {
                    const text = fs.readFileSync(workspaceFile, 'utf8');
                    const node = JSON.parse(text);
                    if (node.master_project == undefined) {
                        throw new Error('"master_project" is not found.')
                    }

                    mainProjPath = `${path}/${node.master_project}`;
                } catch (error) {
                    throw new Error(`Failed to load file ${workspaceFile}. ${error}`);
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