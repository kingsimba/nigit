import { TablePrinter } from "../src/nigitlib/table-printer";
import { expect } from "chai";

describe('TablePrinter', () => {
    it('could print table correctly', () => {
        const table = new TablePrinter();
        table.debugMode = true;
        table.firstColumnWidth = 10;
        table.printLine('module 1', 'master');
        table.printLines('module 2', ['hello', 'world']);
        table.printLine('module 3', 'hello\nworld\n');
        expect(table.debugOutput).deep.equals([
            'module 1  master',
            'module 2  hello',
            '          world',
            'module 3  hello',
            '          world',
        ]);
    });
});
