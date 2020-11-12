"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModuleDnsQueries = void 0;
var exceptions_1 = require("./exceptions");
var lookupgenerators_1 = require("./lookupgenerators");
var loglevel_1 = __importDefault(require("loglevel"));
var numuri_1 = require("./numuri");
function createModuleDnsQueries(moduleId, numUri) {
    return new ModuleDnsQueriesImpl(moduleId, numUri);
}
exports.createModuleDnsQueries = createModuleDnsQueries;
var ModuleDnsQueriesImpl = (function () {
    function ModuleDnsQueriesImpl(moduleId, numUri) {
        this.moduleId = moduleId;
        this.numUri = numUri;
        var lookupGenerator = this.numUri.userinfo !== numuri_1.NO_USER_INFO
            ? lookupgenerators_1.createEmailLookupGenerator(this.numUri)
            : this.numUri.protocol.startsWith('http')
                ? lookupgenerators_1.createUrlLookupGenerator(this.numUri)
                : lookupgenerators_1.createDomainLookupGenerator(this.numUri);
        this._independentRecordLocation = lookupGenerator.getIndependentLocation(this.moduleId);
        this._rootIndependentRecordLocation = lookupGenerator.getRootIndependentLocation(this.moduleId);
        this._hostedRecordLocation = lookupGenerator.getHostedLocation(this.moduleId);
        this._rootHostedRecordLocation = lookupGenerator.getRootHostedLocation(this.moduleId);
        this._populatorLocation = lookupGenerator.isDomainRoot() ? lookupGenerator.getPopulatorLocation(this.moduleId) : null;
    }
    Object.defineProperty(ModuleDnsQueriesImpl.prototype, "populatorLocation", {
        get: function () {
            return this._populatorLocation;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ModuleDnsQueriesImpl.prototype, "independentRecordLocation", {
        get: function () {
            return this._independentRecordLocation;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ModuleDnsQueriesImpl.prototype, "hostedRecordLocation", {
        get: function () {
            return this._hostedRecordLocation;
        },
        enumerable: false,
        configurable: true
    });
    ModuleDnsQueriesImpl.prototype.setEmailRecordDistributionLevels = function (levels) {
        if (this.numUri.userinfo !== numuri_1.NO_USER_INFO) {
            var generator = lookupgenerators_1.createEmailLookupGenerator(this.numUri);
            this._independentRecordLocation = generator.getDistributedIndependentLocation(this.moduleId, levels);
            this._hostedRecordLocation = generator.getDistributedHostedLocation(this.moduleId, levels);
        }
        else {
            loglevel_1.default.warn('Attempt to distribute a non-email lookup using a Zone Distribution Record.');
        }
    };
    ModuleDnsQueriesImpl.prototype.getHostedRecordPath = function () {
        var index = this._hostedRecordLocation.indexOf(this._rootHostedRecordLocation);
        if (index > -1) {
            return toPath(this._hostedRecordLocation.substring(0, index));
        }
        throw new exceptions_1.NumInvalidDnsQueryException("Invalid hosted record location: " + this._hostedRecordLocation);
    };
    ModuleDnsQueriesImpl.prototype.getIndependentRecordPath = function () {
        var index = this._independentRecordLocation.indexOf(this._rootIndependentRecordLocation);
        if (index > -1) {
            return toPath(this._independentRecordLocation.substring(0, index));
        }
        throw new exceptions_1.NumInvalidDnsQueryException("Invalid independent record location: " + this._independentRecordLocation);
    };
    ModuleDnsQueriesImpl.prototype.redirectHostedPath = function (path) {
        var newLocation = '/' === path ? this._rootHostedRecordLocation : "" + fromPath(path) + '.' + this._rootHostedRecordLocation;
        if (newLocation === this._hostedRecordLocation) {
            throw new exceptions_1.NumInvalidRedirectException('Cannot redirect back to the same location.');
        }
        this._hostedRecordLocation = newLocation;
    };
    ModuleDnsQueriesImpl.prototype.redirectIndependentPath = function (path) {
        var newLocation = '/' === path ? this._rootIndependentRecordLocation : "" + fromPath(path) + '.' + this._rootIndependentRecordLocation;
        if (newLocation === this._independentRecordLocation) {
            throw new exceptions_1.NumInvalidRedirectException('Cannot redirect back to the same location.');
        }
        this._independentRecordLocation = newLocation;
    };
    return ModuleDnsQueriesImpl;
}());
function toPath(domainPath) {
    if (domainPath.includes('.')) {
        return '/' + domainPath.split('.').reverse().join('/');
    }
    return "/" + domainPath;
}
function fromPath(path) {
    if (path.includes('/')) {
        return path
            .split('/')
            .reverse()
            .filter(function (i) { return i.trim().length > 0; })
            .join('.');
    }
    return path;
}
//# sourceMappingURL=modulednsqueries.js.map