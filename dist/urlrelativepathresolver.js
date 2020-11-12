"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePath = void 0;
var exceptions_1 = require("./exceptions");
function resolvePath(base, redirect) {
    var e_1, _a;
    var SEP = '/';
    var basePath = base.endsWith(SEP) ? base.substr(0, base.length - 1) : base;
    var redirectPath = redirect;
    if (redirectPath.startsWith(SEP)) {
        basePath = redirectPath;
        redirectPath = '';
    }
    var path = redirectPath.length > 0 ? basePath + SEP + redirectPath : basePath;
    var parts = path.split(SEP);
    var pathStack = new Array();
    try {
        for (var parts_1 = __values(parts), parts_1_1 = parts_1.next(); !parts_1_1.done; parts_1_1 = parts_1.next()) {
            var part = parts_1_1.value;
            if (part === '..') {
                if (pathStack.length === 0) {
                    throw new exceptions_1.RelativePathException('Cannot redirect beyond root');
                }
                pathStack.pop();
            }
            else if (part !== '.') {
                if (part.length > 0) {
                    pathStack.push(part);
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (parts_1_1 && !parts_1_1.done && (_a = parts_1.return)) _a.call(parts_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return SEP + pathStack.join(SEP);
}
exports.resolvePath = resolvePath;
//# sourceMappingURL=urlrelativepathresolver.js.map