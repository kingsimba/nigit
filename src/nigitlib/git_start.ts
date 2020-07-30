import { println, CmdUtils } from "./cmd_utils";
import { GitForAll } from "./git_forall";
import fs from 'fs';

export class GitStart {

    /**
     * push a branch to remote repository
     */
    static cmdStart(branchName: string, projectNames: string[]): number {
        const forall = GitForAll.instance('.');
        if (forall == undefined) {
            return 1;
        }

        // Verify projectNames. All specified projects must exist.
        if (projectNames != undefined) {
            let projectNotFound = false;
            for (const name of projectNames) {
                const proj = forall.projectWithName(name);
                if (proj == undefined) {
                    projectNotFound = true;
                    println(`error: project '${name}' not found`);
                } else if (!fs.existsSync(proj.directory)) {
                    projectNotFound = true;
                    println(`error: project '${name}' not checked out`);
                }
            }
            if (projectNotFound) {
                return 1;
            }
        }

        // run 'git checkout -b BRANCH_NAME -t'
        for (const proj of forall.projects) {
            const projDir = proj.directory;

            // skip unspecified projects
            if (projectNames.length != 0 && projectNames.indexOf(proj.name) == -1) {
                continue;
            }

            // do it
            println(`=== ${proj.name} ===`);
            if (proj.isGitRepository()) {
                CmdUtils.execInConsole(`cd ${projDir} && git checkout -b ${branchName} -t`);
            } else {
                println('Not a git repository. skipped.');
            }
        }


        return 0;
    }
}
