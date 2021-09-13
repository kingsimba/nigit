import chai from "chai";
import { InfoDumper } from "../src/nigitlib/info_dumper";

const expect = chai.expect;

describe('InfoDumper', () => {
    const o = new InfoDumper();
    it('should parse git branch -v successfully', () => {
        const info = o._parseGitInfo(`* (HEAD detached at origin/master) dc28075 reset cost if new pose is set
        fix_trajectory_id                b6ac7bd fix trajectory_id
        `, "myproj");
        expect(info).not.null;
        expect(info?.projectName).equals("myproj");
        expect(info?.branchName).equals("(HEAD detached at origin/master)");
        expect(info?.hashCode).equals("dc28075");
        expect(info?.log).equals("reset cost if new pose is set");
    });
});