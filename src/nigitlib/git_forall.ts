import { GitProject, GitConfig } from "./git_config";
import fs from 'fs';
import { CmdUtils, println, print } from "./cmd_utils";
import { normalize, relative } from "path";
import { resolve } from "path";
import { TablePrinter } from "./table-printer";

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
     * Return the maximum length of all project Names
     */
    private longestProjectName(): string {
        let longestProjectName = '';
        for (const proj of this.projects) {
            if (proj.name.length > longestProjectName.length) {
                longestProjectName = proj.name;
            }
        }
        return longestProjectName;
    }

    static projectNames(): string[] {
        const names: string[] = [];
        GitForAll.forAll('.', (projDir, proj) => {
            names.push(proj.name);
        });
        return names;
    }

    /**
     * Create a table printer for the project.
     * @returns undefined if no workspace is found.
     */
    newTablePrinter(): TablePrinter | undefined {
        const table = new TablePrinter();
        table.firstColumnWidth = this.longestProjectName().length;
        if (table.firstColumnWidth == 0)
            return undefined;
        table.firstColumnWidth = table.firstColumnWidth + 2;
        return table;
    }

    static instance(workDir: string | undefined): GitForAll {
        let o = new GitForAll();
        if (!o.init(workDir)) {
            o = undefined;
        }
        return o;
    }

    private init(workDir: string | undefined): boolean {
        if (workDir == undefined) {
            workDir = '.';
        }

        let mainProject;
        try {
            mainProject = this.findMainProject(workDir);
        } catch (error) {
            println('error: ' + error);
            return false;
        }
        if (mainProject == undefined) {
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

        this.mainProjectPath = mainProject;
        this.workspaceDir = workspaceDir;
        this.projects = config.projects;
        this.mainProject = this.projects[0];
        this.subprojects = this.projects.slice(1);

        for (const proj of this.projects) {
            proj.directory = `${workspaceDir}/${proj.name}`;
        }

        return true;
    }

    /**
     * Execute the same command for all projects. It will try to find nigit.json in |workDir| directory.
     */
    static forAll(workDir: string, callback: (projDir: string, proj: GitProject) => void): boolean {
        const o = GitForAll.instance('.');
        if (!o.init(workDir)) {
            return;
            }

        for (const proj of o.projects) {
            callback(proj.directory, proj);
    }

        return true;
            }

    /**
     * Find the main project which contains the 'nigit.json' file.
     * @param rootDir the root directory to search for `nigit.json`
     * @return the path of the main project
     */
    findMainProject(rootDir: string): string | undefined {
        let mainProjPath;
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

    private mainProjectPath: string;

    /**
     * The projects. The first one is the main project.
     */
    public projects: GitProject[];
    public mainProject: GitProject;
    public subprojects: GitProject[];
    private workspaceDir: string;

}
