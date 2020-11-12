"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_USER_INFO = exports.UrlUserInfo = exports.NO_PATH = exports.UrlPath = exports.Hostname = exports.MODULE_10 = exports.MODULE_9 = exports.MODULE_8 = exports.MODULE_7 = exports.MODULE_6 = exports.MODULE_5 = exports.MODULE_4 = exports.MODULE_3 = exports.MODULE_2 = exports.MODULE_1 = exports.MODULE_0 = exports.PositiveInteger = exports.parseNumUri = exports.buildNumUri = exports.NumUri = void 0;
var url_1 = require("url");
var DOMAIN_REGEX = new RegExp(/^(([^.\s\\\b]+?\.)*?([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?\.)([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?))\.??$/);
var USERINFO_REGEX = new RegExp(/^(?!\s)[^@\f\t\r\b\n]+?(?<!\s)$/);
var PATH_REGEX = new RegExp(/^(\/[^;,/\\?:@&=+$.#\s]+)*\/?$/);
var MAX_LABEL_LENGTH = 63;
var MAX_DOMAIN_NAME_LENGTH = 253;
var MAX_LOCAL_PART_LENGTH = 64;
var NumUri = (function () {
    function NumUri(host, port, userinfo, path) {
        this.host = host;
        this.protocol = 'num';
        this.userinfo = userinfo ? userinfo : exports.NO_USER_INFO;
        this.port = port ? port : exports.MODULE_0;
        this.path = path ? path : exports.NO_PATH;
    }
    Object.defineProperty(NumUri.prototype, "numId", {
        get: function () {
            if (this.userinfo.s !== '') {
                return this.userinfo.s + "@" + this.host.s + this.path.s;
            }
            return "" + this.host.s + this.path.s;
        },
        enumerable: false,
        configurable: true
    });
    NumUri.prototype.withHost = function (host) {
        return new NumUri(host, this.port, this.userinfo, this.path);
    };
    NumUri.prototype.withPort = function (port) {
        return new NumUri(this.host, port, this.userinfo, this.path);
    };
    NumUri.prototype.withPath = function (path) {
        return new NumUri(this.host, this.port, this.userinfo, path);
    };
    NumUri.prototype.withUserinfo = function (userinfo) {
        return new NumUri(this.host, this.port, userinfo, this.path);
    };
    return NumUri;
}());
exports.NumUri = NumUri;
function buildNumUri(host, port, userinfo, path) {
    var thePort = port ? new PositiveInteger(port) : exports.MODULE_0;
    var theUserInfo = userinfo ? new UrlUserInfo(userinfo) : exports.NO_USER_INFO;
    var thePath = path ? new UrlPath(path) : exports.NO_PATH;
    return new NumUri(new Hostname(host), thePort, theUserInfo, thePath);
}
exports.buildNumUri = buildNumUri;
function parseNumUri(uri) {
    var u = url_1.parse(uri.includes('://') ? uri : 'num://' + uri);
    var portNumber = notEmpty(u.port) ? Number.parseInt(u.port, 10) : 0;
    var hostname = u.hostname ? u.hostname : '';
    var host = new Hostname(hostname);
    var port = isPositive(portNumber) ? new PositiveInteger(portNumber) : exports.MODULE_0;
    var userInfo = notEmpty(u.auth) ? new UrlUserInfo(u.auth) : exports.NO_USER_INFO;
    var path = notEmpty(u.path) ? new UrlPath(u.path) : exports.NO_PATH;
    return new NumUri(host, port, userInfo, path);
}
exports.parseNumUri = parseNumUri;
var isPositive = function (n) { return n > -1; };
var notEmpty = function (s) { return s && s.length > 0; };
var PositiveInteger = (function () {
    function PositiveInteger(n) {
        this.n = n;
        if (!(isPositive(n) && Number.isInteger(n))) {
            throw new Error("Value should be zero or a positive integer: " + n);
        }
    }
    return PositiveInteger;
}());
exports.PositiveInteger = PositiveInteger;
exports.MODULE_0 = new PositiveInteger(0);
exports.MODULE_1 = new PositiveInteger(1);
exports.MODULE_2 = new PositiveInteger(2);
exports.MODULE_3 = new PositiveInteger(3);
exports.MODULE_4 = new PositiveInteger(4);
exports.MODULE_5 = new PositiveInteger(5);
exports.MODULE_6 = new PositiveInteger(6);
exports.MODULE_7 = new PositiveInteger(7);
exports.MODULE_8 = new PositiveInteger(8);
exports.MODULE_9 = new PositiveInteger(9);
exports.MODULE_10 = new PositiveInteger(10);
var Hostname = (function () {
    function Hostname(s) {
        this.s = s;
        if (!Hostname.isValid(s)) {
            throw new Error("Invalid domain name: '" + s + "'");
        }
        s.split('.').forEach(function (i) {
            if (i.length > MAX_LABEL_LENGTH) {
                throw new Error("Invalid domain name: '" + s + "'");
            }
        });
    }
    Hostname.isValid = function (s) {
        var matches = s.match(DOMAIN_REGEX);
        return s.length <= MAX_DOMAIN_NAME_LENGTH && matches !== null && matches.length > 0;
    };
    return Hostname;
}());
exports.Hostname = Hostname;
var UrlPath = (function () {
    function UrlPath(s) {
        this.s = s;
        if (!s.startsWith('/') || !s.match(PATH_REGEX)) {
            throw new Error("Invalid URL path: '" + s + "'");
        }
        if (s !== '/') {
            s.substr(1)
                .split('/')
                .forEach(function (pc) {
                if (pc.length === 0) {
                    throw new Error("Invalid URL path: '" + s + "' - zero length path component");
                }
                if (pc.length > MAX_LABEL_LENGTH) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component too long");
                }
                if (pc.includes(' ')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains space");
                }
                if (pc.includes('\n')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains newline");
                }
                if (pc.includes('\r')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains carriage return");
                }
                if (pc.includes('\t')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains tab");
                }
                if (pc.includes('\b')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains backspace");
                }
                if (pc.includes('\f')) {
                    throw new Error("Invalid URL path: '" + pc + "' - path component contains formfeed");
                }
            });
        }
    }
    return UrlPath;
}());
exports.UrlPath = UrlPath;
exports.NO_PATH = new UrlPath('/');
var UrlUserInfo = (function () {
    function UrlUserInfo(s) {
        this.s = s;
        if ((notEmpty(s) && !s.match(USERINFO_REGEX)) ||
            s.length > MAX_LOCAL_PART_LENGTH ||
            s.startsWith('.') ||
            s.endsWith('.') ||
            s.includes('..') ||
            s.includes('\\') ||
            s.includes('\n') ||
            s.includes('\r') ||
            s.includes('\t') ||
            s.includes('\b') ||
            s.includes('\f')) {
            throw new Error("Invalid URL userinfo: " + s);
        }
    }
    return UrlUserInfo;
}());
exports.UrlUserInfo = UrlUserInfo;
exports.NO_USER_INFO = new UrlUserInfo('');
//# sourceMappingURL=numuri.js.map