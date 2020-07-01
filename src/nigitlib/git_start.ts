import { CmdUtils, println } from "./cmd_utils";
import { GitForAll as GitForAll } from "./git_forall";
import fs from 'fs';
import colors from 'colors';

export class GitPush {

    /**
     * push a branch to remote repository
     */
    static cmdStart(branchName: string, projectNames: string[]): number {
        // Verify projectNames. All specified projects must exist.
        if (projectNames != undefined) {
            const allNames = GitForAll.projectNames();
            let projectNotFound = false;
            for (const name of projectNames) {
                if (allNames.indexOf(name) == -1) {
                    projectNotFound = true;
                    println(`error: project ${name} not found`);
                }
            }
            if (projectNotFound) {
                return;
            }
        }

        // run 'git checkout -b BRANCH_NAME -t'
        GitForAll.cmdGitForAll(`git checkout -b ${branchName} -t`);

        return 0;
    }
}
