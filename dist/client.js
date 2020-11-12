"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultCallbackHandler = exports.createClient = void 0;
var lookupstatemachine_1 = require("./lookupstatemachine");
var context_1 = require("./context");
var dnsservices_1 = require("./dnsservices");
var exceptions_1 = require("./exceptions");
var modlservices_1 = require("./modlservices");
var loglevel_1 = __importDefault(require("loglevel"));
var chalk_1 = __importDefault(require("chalk"));
var loglevel_plugin_prefix_1 = __importDefault(require("loglevel-plugin-prefix"));
var INTERPRETER_TIMEOUT_MS = 2000;
var MODULE_PREFIX = '*load=`https://modules.numprotocol.com/';
var MODULE_SUFFIX = '/rcf.txt`';
function createClient(dnsClient) {
    return new NumClientImpl(dnsClient);
}
exports.createClient = createClient;
function createDefaultCallbackHandler() {
    return new DefaultCallbackHandler();
}
exports.createDefaultCallbackHandler = createDefaultCallbackHandler;
var colors = {
    TRACE: chalk_1.default.magenta,
    DEBUG: chalk_1.default.cyan,
    INFO: chalk_1.default.blue,
    WARN: chalk_1.default.yellow,
    ERROR: chalk_1.default.red,
};
var levels = {
    TRACE: 'TRACE',
    DEBUG: 'DEBUG',
    INFO: 'INFO ',
    WARN: 'WARN ',
    ERROR: 'ERROR',
};
loglevel_plugin_prefix_1.default.reg(loglevel_1.default);
loglevel_plugin_prefix_1.default.apply(loglevel_1.default, {
    format: function (level, name, timestamp) {
        return chalk_1.default.gray("[" + timestamp + "]") + " " + colors[level](levels[level]) + " " + chalk_1.default.green(name + ":");
    },
});
loglevel_plugin_prefix_1.default.apply(loglevel_1.default.getLogger('critical'), {
    format: function (level, name, timestamp) {
        return chalk_1.default.red.bold("[" + timestamp + "] " + level + " " + name + ":");
    },
});
var DefaultCallbackHandler = (function () {
    function DefaultCallbackHandler() {
        this.location = null;
        this.result = null;
    }
    DefaultCallbackHandler.prototype.setLocation = function (l) {
        this.location = l;
    };
    DefaultCallbackHandler.prototype.setResult = function (r) {
        this.result = r;
    };
    DefaultCallbackHandler.prototype.getLocation = function () {
        return this.location;
    };
    DefaultCallbackHandler.prototype.getResult = function () {
        return this.result;
    };
    return DefaultCallbackHandler;
}());
var NumClientImpl = (function () {
    function NumClientImpl(dnsClient) {
        this.dnsServices = dnsservices_1.createDnsServices(dnsClient);
        this.modlServices = modlservices_1.createModlServices();
    }
    NumClientImpl.prototype.createContext = function (numAddress) {
        return new context_1.Context(numAddress);
    };
    NumClientImpl.prototype.retrieveNumRecord = function (ctx, handler) {
        return __awaiter(this, void 0, void 0, function () {
            var modl, json, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3, 7];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4, this.retrieveModlRecordInternal(ctx)];
                    case 2:
                        modl = _a.sent();
                        if (!modl) return [3, 4];
                        return [4, this.interpret(modl, ctx.numAddress.port, ctx.userVariables)];
                    case 3:
                        json = _a.sent();
                        if (json) {
                            if (handler) {
                                handler.setResult(json);
                            }
                        }
                        return [2, json];
                    case 4: return [2, null];
                    case 5:
                        e_1 = _a.sent();
                        if (e_1 instanceof exceptions_1.NumMaximumRedirectsExceededException) {
                            loglevel_1.default.warn('Too many redirects. Aborting the lookup.');
                            ctx.result = null;
                            ctx.location = context_1.Location.NONE;
                            return [2, null];
                        }
                        else if (e_1 instanceof exceptions_1.NumLookupRedirect) {
                            ctx.location = context_1.Location.INDEPENDENT;
                            ctx.handleQueryRedirect(e_1.message);
                        }
                        return [3, 6];
                    case 6: return [3, 0];
                    case 7: return [2];
                }
            });
        });
    };
    NumClientImpl.prototype.retrieveModlRecord = function (ctx, handler) {
        return __awaiter(this, void 0, void 0, function () {
            var modl, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3, 7];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4, this.retrieveModlRecordInternal(ctx)];
                    case 2:
                        modl = _a.sent();
                        if (!modl) return [3, 4];
                        return [4, this.interpret(modl, ctx.numAddress.port, ctx.userVariables)];
                    case 3:
                        _a.sent();
                        if (handler) {
                            handler.setResult(modl);
                        }
                        return [2, modl];
                    case 4: return [2, null];
                    case 5:
                        e_2 = _a.sent();
                        if (e_2 instanceof exceptions_1.NumMaximumRedirectsExceededException) {
                            loglevel_1.default.warn('Too many redirects. Aborting the lookup.');
                            ctx.result = null;
                            ctx.location = context_1.Location.NONE;
                            return [2, null];
                        }
                        else if (e_2 instanceof exceptions_1.NumLookupRedirect) {
                            ctx.location = context_1.Location.INDEPENDENT;
                            ctx.handleQueryRedirect(e_2.message);
                        }
                        return [3, 6];
                    case 6: return [3, 0];
                    case 7: return [2];
                }
            });
        });
    };
    NumClientImpl.prototype.retrieveModlRecordInternal = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var query, sm, result, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = ctx.location;
                                        switch (_a) {
                                            case context_1.Location.INDEPENDENT: return [3, 1];
                                            case context_1.Location.HOSTED: return [3, 3];
                                            case context_1.Location.POPULATOR: return [3, 5];
                                            case context_1.Location.NONE: return [3, 7];
                                        }
                                        return [3, 7];
                                    case 1: return [4, this.dnsQuery(ctx.queries.independentRecordLocation, ctx)];
                                    case 2: return [2, _b.sent()];
                                    case 3: return [4, this.dnsQuery(ctx.queries.hostedRecordLocation, ctx)];
                                    case 4: return [2, _b.sent()];
                                    case 5: return [4, this.populatorQuery(ctx)];
                                    case 6: return [2, _b.sent()];
                                    case 7: return [2, false];
                                }
                            });
                        }); };
                        sm = lookupstatemachine_1.createLookupLocationStateMachine();
                        _b.label = 1;
                    case 1:
                        if (!!sm.complete()) return [3, 4];
                        loglevel_1.default.info("Checking location: '" + ctx.location + "'");
                        return [4, query()];
                    case 2:
                        result = _b.sent();
                        _a = ctx;
                        return [4, sm.step(result)];
                    case 3:
                        _a.location = _b.sent();
                        return [3, 1];
                    case 4:
                        loglevel_1.default.info("Lookup result: '" + ctx.result + "', location: '" + ctx.location + "'");
                        return [2, ctx.result];
                }
            });
        });
    };
    NumClientImpl.prototype.interpret = function (modl, port, userVariables) {
        return __awaiter(this, void 0, void 0, function () {
            var uv, _a, _b, k, enhancedModl;
            var e_3, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        uv = '';
                        try {
                            for (_a = __values(userVariables.keys()), _b = _a.next(); !_b.done; _b = _a.next()) {
                                k = _b.value;
                                uv += k + "=" + userVariables.get(k) + ";";
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        enhancedModl = "" + uv + MODULE_PREFIX + port.n + MODULE_SUFFIX + ";" + modl;
                        return [4, this.modlServices.interpretNumRecord(enhancedModl, INTERPRETER_TIMEOUT_MS)];
                    case 1: return [2, _d.sent()];
                }
            });
        });
    };
    NumClientImpl.prototype.dnsQuery = function (query, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.dnsServices.getRecordFromDns(query, ctx.dnssec)];
                    case 1:
                        result = _a.sent();
                        if (result.length > 0) {
                            ctx.result = result;
                            return [2, true];
                        }
                        return [2, false];
                }
            });
        });
    };
    NumClientImpl.prototype.populatorQuery = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var populatorLocation, result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        populatorLocation = ctx.queries.populatorLocation;
                        if (!populatorLocation) return [3, 5];
                        return [4, this.dnsServices.getRecordFromDns(populatorLocation, false)];
                    case 1:
                        result = _b.sent();
                        if (!result.includes('status_')) return [3, 2];
                        if (result.includes('code=1')) {
                            return [2, 1];
                        }
                        else if (result.includes('code=2')) {
                            return [2, 2];
                        }
                        else if (result.includes('code=3')) {
                            return [2, 3];
                        }
                        else {
                            return [2, false];
                        }
                        return [3, 5];
                    case 2:
                        if (!result.includes('error_')) return [3, 3];
                        return [2, false];
                    case 3:
                        _a = ctx;
                        return [4, this.interpret(result, ctx.numAddress.port, ctx.userVariables)];
                    case 4:
                        _a.result = _b.sent();
                        return [2, true];
                    case 5: return [2, false];
                }
            });
        });
    };
    return NumClientImpl;
}());
//# sourceMappingURL=client.js.map