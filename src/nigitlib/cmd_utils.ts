import { exec, execSync, spawnSync } from 'child_process'
import colors from "colors";
import fs from 'fs'

export class CmdResult {
    stdout = '';
    stderr = '';
    exitCode = 0;
}

export enum MessageType {
    auto = 1,
    weakText,
    text,
    info,
    warning,
    error
}

export class CmdUtils {

    /**
     * Run command and get the stdout/stderr/exitCode
     * @param cmd The command to run. Like "git status".
     */
    static exec(cmd: string): CmdResult {
        var rtn = new CmdResult();

        try {
            rtn.stdout = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
        } catch (error) {
            if (error.stdout) {
                rtn.stdout = error.stdout.toString();
            }
            if (error.stderr) {
                rtn.stderr = error.stderr.toString();
            }
            rtn.exitCode = error.status;
        }

        return rtn;
    }

    /**
     * Asynchronously execute command. It supports both callback and Promise.
     * @param cmd The command to run. Like 'git status'
     * @param callback A optional callback function
     */
    static execAsync(cmd: string, callback?: (result: CmdResult) => void): Promise<CmdResult> | null {
        if (callback) {
            exec(cmd, (err, stdout, stderr) => {
                const rtn = new CmdResult();
                if (err) {
                    rtn.exitCode = err.code;
                } else {
                    rtn.exitCode = 0;
                }
                rtn.stdout = stdout;
                rtn.stderr = stderr;
                callback(rtn);
            });

            return null;
        } else {
            return new Promise<CmdResult>((resolve) => {
                this.execAsync(cmd, (result) => {
                    resolve(result);
                })
            });
        }
    }

    /**
     * Run command the print stdout/stderr to console
     * @param cmd The command to run. Like 'git status'
     * @return The exit code of the command
     */
    static execInConsole(cmd: string): number {
        const result = this.exec(cmd);
        if (result.exitCode == 0) {
            print(result.stdout);
        } else {
            print(result.stderr, MessageType.error);
        }
        return result.exitCode;
    }

    static println(text: string, type = MessageType.auto) {
        this.print(text + '\n', type);
    }

    static print(text: string, type = MessageType.auto) {
        if (type === MessageType.auto) {
            if (text.startsWith('error:')) {
                type = MessageType.error;
            } else if (text.startsWith('warning')) {
                type = MessageType.warning;
            } else if (text.startsWith('===')) {
                type = MessageType.info;
            }
        }
        switch (type) {
            case MessageType.warning:
                process.stdout.write(colors.yellow(text));
                break;
            case MessageType.error:
                process.stdout.write(colors.red(text));
                break;
            case MessageType.info:
                process.stdout.write(colors.green(text));
                break;
            case MessageType.weakText:
                process.stdout.write(colors.gray(text));
                break;
            default:
                process.stdout.write(text);
                break;
        }
    }

    static printCommandError(cmd: string, error: any) {
        println('error: failed to execute command');
        print(`> ${cmd}\n`, MessageType.error);
        print(error, MessageType.error);
    }

    static createDeepDir(path: string): boolean {
        try {
            const pieces = path.split('/');
            for (let index = 0; index < pieces.length; index++) {
                const dir = pieces.slice(0, index + 1).join('/');
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    static deleteFileIfExists(path: string) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }

    static deleteFolderRecursive(path: string) {
        if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
            fs.readdirSync(path).forEach((file, index) => {
                const curPath = path + "/" + file;

                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    CmdUtils.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });

            fs.rmdirSync(path);
        }
    };
}

export const print = CmdUtils.print;
export const println = CmdUtils.println;
