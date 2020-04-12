import { GitForAll as GitForAll } from "./git_forall";
import chai from 'chai';
import chai_string from "chai-string";

chai.use(chai_string);

const expect = chai.expect;

describe('GitForAll', () => {
    it('should execute command for all git projects', () => {
        const commands : string[] = [];
        GitForAll.forAll('.', (projDir, proj) => {
            commands.push(`${proj.name}`);
            expect(projDir).endsWith(`${proj.name}`);
        });
        expect(commands.join(' ')).equals('nigit json-script express-typescript-mocha-vscode ncgeo zlib');
    });

    it('should return nigit.json in root dir', () => {
        expect(GitForAll._findMainProject('..')).equals('../nigit');
    });

    it('should return nigit.json even in subfolder', () => {
        expect(GitForAll._findMainProject('src/nigitlib')).equals('.');
    });

    it('should return undefined if nigit.json is not found', () => {
        expect(GitForAll._findMainProject('../..')).is.undefined;
    });
});
