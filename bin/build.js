#!/usr/bin/env node
var child_process = require('child_process');
var fs = require('fs');
var colors = require('colors');

function deleteFolderRecursive(path) {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;

            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });

        fs.rmdirSync(path);
    }
};

function printCommand(cmd) {
    console.log(colors.green('$ ' + cmd));
}

function exec(cmd) {
    printCommand(cmd);
    child_process.execSync(cmd, { encoding: 'utf8', stdio: 'inherit' });
}

printCommand("rm dist");
deleteFolderRecursive('./dist');

exec('npx tsc');

// Merge into a single file will cause trouble when published with 'npm link'
// exec('ncc build dist/nigit.js -o dist --minify');
// fs.renameSync('dist/index.js', 'dist/nigit.js');
