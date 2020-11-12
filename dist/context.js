"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.Location = void 0;
var numuri_1 = require("./numuri");
var modulednsqueries_1 = require("./modulednsqueries");
var loglevel_1 = __importDefault(require("loglevel"));
var exceptions_1 = require("./exceptions");
var urlrelativepathresolver_1 = require("./urlrelativepathresolver");
var MAX_NUM_REDIRECTS = 3;
var Location;
(function (Location) {
    Location["HOSTED"] = "HOSTED";
    Location["INDEPENDENT"] = "INDEPENDENT";
    Location["POPULATOR"] = "POPULATOR";
    Location["NONE"] = "NONE";
})(Location = exports.Location || (exports.Location = {}));
var Context = (function () {
    function Context(numAddress) {
        this.location = Location.INDEPENDENT;
        this.result = null;
        this.redirectCount = 0;
        this.dnssec = false;
        this.numAddress = numAddress;
        this._queries = modulednsqueries_1.createModuleDnsQueries(numAddress.port, numAddress);
        this.userVariables = new Map();
    }
    Context.prototype.setUserVariable = function (name, value) {
        this.userVariables.set(name, value);
    };
    Context.prototype.incrementRedirectCount = function () {
        return ++this.redirectCount;
    };
    Object.defineProperty(Context.prototype, "queries", {
        get: function () {
            return this._queries;
        },
        enumerable: false,
        configurable: true
    });
    Context.prototype.handleQueryRedirect = function (redirect) {
        loglevel_1.default.info('Query Redirected to: {}', redirect);
        var redirectCount = this.incrementRedirectCount();
        if (redirectCount >= MAX_NUM_REDIRECTS) {
            loglevel_1.default.debug('Maximum Redirects Exceeded. (max={})', MAX_NUM_REDIRECTS);
            throw new exceptions_1.NumMaximumRedirectsExceededException();
        }
        if (redirect.includes(':') || numuri_1.Hostname.isValid(redirect)) {
            try {
                var uri = numuri_1.parseNumUri(redirect);
                this._queries = modulednsqueries_1.createModuleDnsQueries(uri.port, uri);
            }
            catch (e) {
                throw new exceptions_1.NumInvalidRedirectException(e.message);
            }
        }
        else {
            switch (this.location) {
                case Location.INDEPENDENT:
                    this.handleIndependentQueryRedirect(redirect);
                    break;
                case Location.HOSTED:
                    this.handleHostedQueryRedirect(redirect);
                    break;
                default:
            }
        }
    };
    Context.prototype.handleHostedQueryRedirect = function (redirectTo) {
        var hostedRecordPath = this._queries.getHostedRecordPath();
        try {
            this._queries.redirectHostedPath(urlrelativepathresolver_1.resolvePath(hostedRecordPath, redirectTo));
        }
        catch (e) {
            throw new exceptions_1.NumInvalidRedirectException(e);
        }
    };
    Context.prototype.handleIndependentQueryRedirect = function (redirectTo) {
        var independentRecordPath = this._queries.getIndependentRecordPath();
        try {
            this._queries.redirectIndependentPath(urlrelativepathresolver_1.resolvePath(independentRecordPath, redirectTo));
        }
        catch (e) {
            throw new exceptions_1.NumInvalidRedirectException(e);
        }
    };
    return Context;
}());
exports.Context = Context;
//# sourceMappingURL=context.js.map