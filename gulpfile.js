const { dest, series } = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const tsProject = ts.createProject("tsconfig.json");

const clean = function () {
    return del('dist/**', { force: true });
}

const build = function () {
    return tsProject
        .src()
        .pipe(tsProject())
        .js.pipe(dest("dist"));
};

exports.clean = clean;
exports.default = series(clean, build);
