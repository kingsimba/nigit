import chai from 'chai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { CompletionScript } from '../src/nigitlib/completion';

const expect = chai.expect;

describe('CompletionScript', () => {
    it('should generate a bash script that registers completion', () => {
        const script = CompletionScript.generate(false);
        expect(script).to.contain('complete -F _nigit_completions nigit');
        expect(script).to.contain('clone list status branch tag');
        expect(script).to.contain('${COMP_WORDS[COMP_CWORD]}');
    });

    it('should generate a zsh script with bashcompinit', () => {
        const script = CompletionScript.generate(true);
        expect(script).to.contain('autoload -U bashcompinit');
        expect(script).to.contain('bashcompinit');
    });

    it('should list subcommands and options', () => {
        const script = CompletionScript.generate(false);
        expect(script).to.contain('--skip-main');
        expect(script).to.contain('--force');
        expect(script).to.contain('__nigit_projects');
    });

    describe('detectRcFile', () => {
        it('should pick .zshrc for zsh', () => {
            expect(CompletionScript.detectRcFile(false, '/bin/zsh')).to.contain('.zshrc');
            expect(CompletionScript.detectRcFile(true, '/bin/bash')).to.contain('.zshrc');
        });

        it('should pick .bashrc otherwise', () => {
            expect(CompletionScript.detectRcFile(false, '/bin/bash')).to.contain('.bashrc');
        });

        it('should detect zsh from the environment even if SHELL is bash', () => {
            const prev = process.env.ZSH_VERSION;
            process.env.ZSH_VERSION = '5.9';
            try {
                expect(CompletionScript.detectRcFile(false, '/bin/bash')).to.contain('.zshrc');
            } finally {
                if (prev === undefined) {
                    delete process.env.ZSH_VERSION;
                } else {
                    process.env.ZSH_VERSION = prev;
                }
            }
        });
    });

    describe('install', () => {
        const tmpFile = path.join(os.tmpdir(), `nigit-completion-${process.pid}-${Date.now()}.rc`);

        after(() => {
            if (fs.existsSync(tmpFile)) {
                fs.unlinkSync(tmpFile);
            }
        });

        it('should append the source line to the rc file', () => {
            fs.writeFileSync(tmpFile, '# existing line\n');
            const msg = CompletionScript.install(false, tmpFile);
            const content = fs.readFileSync(tmpFile, 'utf8');
            expect(content).to.contain('# existing line');
            expect(content).to.contain('source <(nigit completion)');
            expect(msg).to.contain('Added tab completion to ' + tmpFile);
        });

        it('should not duplicate an existing entry', () => {
            fs.writeFileSync(tmpFile, 'source <(nigit completion)\n');
            const msg = CompletionScript.install(false, tmpFile);
            const content = fs.readFileSync(tmpFile, 'utf8');
            expect(content.match(/nigit completion/g)).to.have.length(1);
            expect(msg).to.contain('already enabled');
        });
    });
});
