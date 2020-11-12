"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUrlLookupGenerator = exports.createEmailLookupGenerator = exports.createDomainLookupGenerator = void 0;
var hashutils_1 = require("./hashutils");
var punycode_1 = __importDefault(require("punycode"));
var loglevel_1 = __importDefault(require("loglevel"));
var exceptions_1 = require("./exceptions");
var url_1 = require("url");
var numuri_1 = require("./numuri");
var _NUM = '._num.';
var DNPREFIX = '_';
var TLZ = 'num.net';
var EMAIL_SEP = 'e';
var POP_3LZ = 'populator';
var DEFAULT_DEPTH = 3;
function createDomainLookupGenerator(numUri) {
    return new DomainLookupGenerator(numUri);
}
exports.createDomainLookupGenerator = createDomainLookupGenerator;
function createEmailLookupGenerator(numUri) {
    return new EmailLookupGeneratorImpl(numUri);
}
exports.createEmailLookupGenerator = createEmailLookupGenerator;
function createUrlLookupGenerator(numUri) {
    return new UrlLookupGenerator(numUri);
}
exports.createUrlLookupGenerator = createUrlLookupGenerator;
var BaseLookupGenerator = (function () {
    function BaseLookupGenerator(numUri) {
        this._numUri = numUri;
        this._branch = '';
    }
    BaseLookupGenerator.prototype.getIndependentLocation = function (moduleId) {
        var result = this.getRootIndependentLocation(moduleId);
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    BaseLookupGenerator.prototype.getHostedLocation = function (moduleId) {
        var result = this.getRootHostedLocation(moduleId);
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    BaseLookupGenerator.prototype.isDomainRoot = function () {
        return this._branch === '';
    };
    BaseLookupGenerator.prototype.getPopulatorLocation = function (moduleId) {
        return this.isDomainRoot() ? moduleId.n + "." + DNPREFIX + this._numUri.host.s + "." + POP_3LZ + "." + TLZ + "." : null;
    };
    BaseLookupGenerator.prototype.getRootIndependentLocation = function (moduleId) {
        return "" + moduleId.n + _NUM + this._numUri.host.s + ".";
    };
    BaseLookupGenerator.prototype.getRootIndependentLocationNoModuleNumber = function (addTrailingDot) {
        if (addTrailingDot) {
            return "_num." + this._numUri.host.s + ".";
        }
        else {
            return "_num." + this._numUri.host.s;
        }
    };
    BaseLookupGenerator.prototype.getRootHostedLocation = function (moduleId) {
        return moduleId.n + "." + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ + ".";
    };
    BaseLookupGenerator.prototype.getRootHostedLocationNoModuleNumber = function (addTrailingDot) {
        if (addTrailingDot) {
            return "" + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ + ".";
        }
        else {
            return "" + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ;
        }
    };
    BaseLookupGenerator.prototype.validate = function (_numId, _moduleId) {
        throw new Error('Not implemented');
    };
    return BaseLookupGenerator;
}());
function transformBranch(s) {
    if (s === '/') {
        return '';
    }
    var i = s.indexOf('/');
    return s
        .substring(i + 1)
        .split('/')
        .reverse()
        .join('.');
}
function normaliseDomainName(domainName) {
    if (!domainName) {
        throw new exceptions_1.NumInvalidParameterException('Null domain name cannot be normalised');
    }
    if (domainName.trim() === '') {
        throw new exceptions_1.NumInvalidParameterException('Empty domain name cannot be normalised');
    }
    if (domainName.startsWith('http')) {
        try {
            var host = new url_1.URL(domainName).hostname;
            return normaliseDomainName(host);
        }
        catch (e) {
            if (e instanceof exceptions_1.NumException) {
                throw e;
            }
            else {
                throw new exceptions_1.NumBadUrlException("Invalid URL: " + domainName, e);
            }
        }
    }
    var result = domainName;
    if (result.startsWith('www.')) {
        result = result.substring(4);
    }
    if (result.startsWith('.')) {
        result = result.substring(1);
    }
    if (result.endsWith('.')) {
        result = result.substring(0, result.length - 1);
    }
    result = punycode_1.default.toASCII(result);
    return result;
}
function normalisePath(path) {
    var result = '/';
    if (path.length > 0) {
        var pathComponents = path.split('/');
        var nonEmptyPathComponents = pathComponents.filter(function (s) { return s && s.length > 0; });
        if (nonEmptyPathComponents.length > 0 && nonEmptyPathComponents[nonEmptyPathComponents.length - 1].includes('.')) {
            nonEmptyPathComponents.pop();
        }
        if (nonEmptyPathComponents.length > 0) {
            result += nonEmptyPathComponents.join('/').split(' ').join('_');
        }
    }
    return result;
}
var DomainLookupGenerator = (function (_super) {
    __extends(DomainLookupGenerator, _super);
    function DomainLookupGenerator(numUri) {
        var _this = _super.call(this, numUri) || this;
        var branch = transformBranch(normalisePath(numUri.path.s));
        _this._branch = branch !== '' ? punycode_1.default.toASCII(branch) : branch;
        if (_this._branch !== branch) {
            loglevel_1.default.debug("Query " + _this._branch + " punycode " + branch);
        }
        _this._numUri = _this._numUri.withHost(new numuri_1.Hostname(normaliseDomainName(numUri.host.s)));
        return _this;
    }
    return DomainLookupGenerator;
}(BaseLookupGenerator));
var EmailLookupGeneratorImpl = (function (_super) {
    __extends(EmailLookupGeneratorImpl, _super);
    function EmailLookupGeneratorImpl(numUri) {
        var _this = _super.call(this, numUri) || this;
        var localPart = _this._numUri.userinfo;
        var newUserinfo = localPart !== numuri_1.NO_USER_INFO ? punycode_1.default.toASCII(localPart.s) : localPart.s;
        _this._numUri = _this._numUri.withUserinfo(new numuri_1.UrlUserInfo(newUserinfo));
        _this._numUri = _this._numUri.withHost(new numuri_1.Hostname(normaliseDomainName(numUri.host.s)));
        var branch = transformBranch(normalisePath(numUri.path.s));
        _this._branch = branch !== '' ? punycode_1.default.toASCII(branch) : branch;
        if (branch !== _this._branch) {
            loglevel_1.default.debug("Query " + branch + " punycode " + _this._branch);
        }
        return _this;
    }
    Object.defineProperty(EmailLookupGeneratorImpl.prototype, "localPart", {
        get: function () {
            return this._numUri.userinfo.s;
        },
        enumerable: false,
        configurable: true
    });
    EmailLookupGeneratorImpl.prototype.getIndependentLocation = function (moduleId) {
        var result = this.getRootIndependentLocation(moduleId);
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    EmailLookupGeneratorImpl.prototype.getHostedLocation = function (moduleId) {
        var result = this.getRootHostedLocation(moduleId);
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    EmailLookupGeneratorImpl.prototype.getPopulatorLocation = function (moduleId) {
        loglevel_1.default.warn("getPopulatorLocation called on email with " + moduleId.n);
        return null;
    };
    EmailLookupGeneratorImpl.prototype.getRootIndependentLocation = function (moduleId) {
        return moduleId.n + "." + DNPREFIX + this.localPart + "." + EMAIL_SEP + _NUM + this._numUri.host.s + ".";
    };
    EmailLookupGeneratorImpl.prototype.getRootIndependentLocationNoModuleNumber = function (addTrailingDot) {
        if (addTrailingDot) {
            return "" + DNPREFIX + this.localPart + "." + EMAIL_SEP + _NUM + this._numUri.host.s + ".";
        }
        else {
            return "" + DNPREFIX + this.localPart + "." + EMAIL_SEP + _NUM + this._numUri.host.s;
        }
    };
    EmailLookupGeneratorImpl.prototype.getRootHostedLocation = function (moduleId) {
        return moduleId.n + "." + DNPREFIX + this.localPart + "." + EMAIL_SEP + "." + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ + ".";
    };
    EmailLookupGeneratorImpl.prototype.getRootHostedLocationNoModuleNumber = function (addTrailingDot) {
        if (addTrailingDot) {
            return "" + DNPREFIX + this.localPart + "." + EMAIL_SEP + "." + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ + ".";
        }
        else {
            return "" + DNPREFIX + this.localPart + "." + EMAIL_SEP + "." + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ;
        }
    };
    EmailLookupGeneratorImpl.prototype.getDistributedIndependentLocation = function (moduleId, levels) {
        var emailLocalPartHash = hashutils_1.hashByDepth(this._numUri.userinfo.s, levels.n);
        var result = moduleId.n + "." + DNPREFIX + this.localPart + emailLocalPartHash + "." + EMAIL_SEP + _NUM + this._numUri.host.s + ".";
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    EmailLookupGeneratorImpl.prototype.getDistributedHostedLocation = function (moduleId, levels) {
        var emailLocalPartHash = hashutils_1.hashByDepth(this._numUri.userinfo.s, levels.n);
        var result = moduleId.n + "." + DNPREFIX + this.localPart + emailLocalPartHash + "." + EMAIL_SEP + "." + DNPREFIX + this._numUri.host.s + hashutils_1.hashByDepth(this._numUri.host.s, DEFAULT_DEPTH) + "." + TLZ + ".";
        return this.isDomainRoot() ? result : this._branch + "." + result;
    };
    return EmailLookupGeneratorImpl;
}(BaseLookupGenerator));
var UrlLookupGenerator = (function (_super) {
    __extends(UrlLookupGenerator, _super);
    function UrlLookupGenerator(numUri) {
        var _this = _super.call(this, numUri) || this;
        _this._numUri = _this._numUri.withHost(new numuri_1.Hostname(normaliseDomainName(numUri.host.s)));
        var branch = transformBranch(normalisePath(numUri.path.s));
        _this._branch = branch !== '' ? punycode_1.default.toASCII(branch) : branch;
        if (branch !== _this._branch) {
            loglevel_1.default.debug("Query " + branch + " punycode " + _this._branch);
        }
        return _this;
    }
    return UrlLookupGenerator;
}(BaseLookupGenerator));
//# sourceMappingURL=lookupgenerators.js.map