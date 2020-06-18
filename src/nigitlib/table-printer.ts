import colors from 'colors';

export class TablePrinter {
    private _firstColumnWidth = 0;
    private _debugMode = false;
    public debugOutput: string[];

    set firstColumnWidth(width: number) {
        this._firstColumnWidth = width;
    }

    get firstColumnWidth(): number {
        return this._firstColumnWidth;
    }

    printHeader(col1: string, col2: string) {
        this.log(colors.green(col1.padEnd(this.firstColumnWidth)) + colors.green(col2));
        this.log(colors.green('-'.repeat(this.firstColumnWidth + col2.length)))
    }

    printLine(col1: string, col2: string) {
        if (col2.indexOf('\n') != -1) {
            this.printLines(col1, col2.split(/\r?\n/));
        } else {
            this.log(col1.padEnd(this.firstColumnWidth) + col2);
        }
    }

    printLines(col1: string, lines: string[]) {
        for (const [i, line] of lines.entries()) {
            if (i == 0) {
                this.log(col1.padEnd(this.firstColumnWidth) + line);
            } else if (!(i == lines.length - 1 && line.length == 0)) {
                this.log(''.padEnd(this.firstColumnWidth) + line);
            }
        }
    }

    set debugMode(debug: boolean) {
        this._debugMode = debug;
        if (this.debugOutput == undefined) {
            this.debugOutput = [];
        }
    }

    get debugMode(): boolean {
        return this._debugMode;
    }

    private log(line: string) {
        if (this.debugMode) {
            this.debugOutput.push(line);
        } else {
            console.log(line);
        }
    }
}
