/**
 * Generates a bash/zsh completion script for the nigit CLI.
 *
 * The generated script is meant to be sourced from the user's shell
 * profile, so it needs to be self-contained (it only relies on bash
 * built-ins, grep/sed and git).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

export class CompletionScript {
    static generate(zsh: boolean): string {
        const head = zsh
            ? 'autoload -U bashcompinit\nbashcompinit\n\n'
            : '';

        return head + `# nigit shell completion
# Source it from your shell profile:
#   bash: echo "source <(nigit completion)" >> ~/.bashrc
#   zsh:  echo "source <(nigit completion --zsh)" >> ~/.zshrc

# Subproject names, derived from nigit.json in the current directory.
__nigit_projects() {
    if [ -f nigit.json ]; then
        grep -o '"url"[[:space:]]*:[[:space:]]*"[^"]*"' nigit.json \\
            | sed -E 's/\\.(git|zip)"$/"/' \\
            | sed -E 's/.*[\\/:]([^\\/:]+)"/\\1/'
    fi
}

# Branch names of the current git repository.
__nigit_branches() {
    git branch --format='%(refname:short)' 2>/dev/null
}

_nigit_completions() {
    local cur
    cur="\${COMP_WORDS[COMP_CWORD]}"

    local commands="clone list status branch tag pull push fetch start clean checkout checkout-info dump-info forall"
    local cmd

    if [ "$COMP_CWORD" -eq 1 ]; then
        COMPREPLY=( \$(compgen -W "\$commands" -- "\$cur") )
        return 0
    fi

    cmd="\${COMP_WORDS[1]}"

    case "\$cmd" in
        clone)
            ;;
        branch)
            COMPREPLY=( \$(compgen -W "--all --features" -- "\$cur") )
            ;;
        tag)
            COMPREPLY=( \$(compgen -W "-l --list -c --create" -- "\$cur") )
            ;;
        pull)
            COMPREPLY=( \$(compgen -W "--skip-main \$(__nigit_projects)" -- "\$cur") )
            ;;
        push)
            COMPREPLY=( \$(compgen -W "\$(__nigit_projects)" -- "\$cur") )
            ;;
        fetch)
            COMPREPLY=( \$(compgen -W "--skip-main --prune --tags --force -p -t -f \$(__nigit_projects)" -- "\$cur") )
            ;;
        start)
            if [ "$COMP_CWORD" -eq 2 ]; then
                COMPREPLY=( \$(compgen -W "\$(__nigit_branches)" -- "\$cur") )
            else
                COMPREPLY=( \$(compgen -W "\$(__nigit_projects)" -- "\$cur") )
            fi
            ;;
        clean)
            COMPREPLY=( \$(compgen -W "--force --dry -f -n" -- "\$cur") )
            ;;
        checkout|co)
            COMPREPLY=( \$(compgen -W "\$(__nigit_branches)" -- "\$cur") )
            ;;
        checkout-info|dump-info)
            COMPREPLY=( \$(compgen -f -- "\$cur") )
            ;;
        forall)
            ;;
    esac
    return 0
}

complete -o nosort -F _nigit_completions nigit
`;
    }

    static detectRcFile(zsh: boolean, shell?: string): string {
        const s = shell || process.env.SHELL || '';
        const home = os.homedir();
        // Prefer the shell that actually invoked us (inherited by child
        // processes), then fall back to $SHELL.
        const isZsh = zsh || process.env.ZSH_VERSION !== undefined || s.includes('zsh');
        return path.join(home, isZsh ? '.zshrc' : '.bashrc');
    }

    /**
     * Append the "source" line to the user's shell config so that
     * completion is enabled for new shells. Returns a message for the user.
     */
    static install(zsh: boolean, rcFile?: string): string {
        const file = rcFile || CompletionScript.detectRcFile(zsh);
        const line = `source <(nigit completion${zsh ? ' --zsh' : ''})`;
        const alreadyInstalled =
            fs.existsSync(file) &&
            fs
                .readFileSync(file, 'utf8')
                .split('\n')
                .some((l) => l.includes('nigit completion'));
        if (!alreadyInstalled) {
            fs.appendFileSync(file, `\n${line}\n`);
            return `Added tab completion to ${file}. Restart your shell or run "source ${file}" to enable it.`;
        }
        return `Tab completion is already enabled in ${file}.`;
    }
}
