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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDnsClient = exports.Question = exports.DoHResolver = void 0;
var axios_1 = __importDefault(require("axios"));
var exceptions_1 = require("./exceptions");
var punycode_1 = __importDefault(require("punycode"));
var loglevel_1 = __importDefault(require("loglevel"));
var NXDOMAIN = 3;
var DoHResolver = (function () {
    function DoHResolver(name, url) {
        this.name = name;
        this.url = url;
    }
    return DoHResolver;
}());
exports.DoHResolver = DoHResolver;
var Question = (function () {
    function Question(name, type, dnssec) {
        this.name = punycode_1.default.toASCII(name);
        this.type = type;
        this.dnssec = dnssec;
        if (this.name !== name) {
            loglevel_1.default.debug("Query " + name + " punycode " + this.name);
        }
    }
    return Question;
}());
exports.Question = Question;
function createDnsClient(resolver) {
    return new DnsClientImpl(resolver);
}
exports.createDnsClient = createDnsClient;
var DEFAULT_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve');
var DnsClientImpl = (function () {
    function DnsClientImpl(resolver) {
        this.resolver = resolver ? resolver : DEFAULT_RESOLVER;
        loglevel_1.default.info("DNS client configured with resolver: " + this.resolver.url);
    }
    DnsClientImpl.prototype.query = function (question) {
        return __awaiter(this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.queryUsingResolver(question, this.resolver)];
                    case 2:
                        data = _a.sent();
                        return [3, 4];
                    case 3:
                        err_1 = _a.sent();
                        if (err_1 instanceof exceptions_1.BadDnsStatusException) {
                            if (err_1.status === NXDOMAIN) {
                                loglevel_1.default.warn('Bad DNS status - NXDOMAIN');
                            }
                            else {
                                loglevel_1.default.warn("Error resolving " + question.name + " with " + this.resolver.name);
                            }
                        }
                        else {
                            loglevel_1.default.warn("Error resolving " + question.name + " with " + this.resolver.name + ".");
                        }
                        return [3, 4];
                    case 4: return [2, data];
                }
            });
        });
    };
    DnsClientImpl.prototype.queryUsingResolver = function (question, resolver) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loglevel_1.default.info("Query made using " + resolver.name + " for the DNS " + question.type + " record(s) at " + question.name + " dnssec:" + question.dnssec);
                        params = "name=" + question.name + "&type=" + question.type + "&dnssec=" + (question.dnssec ? '1' : '0');
                        url = resolver.url + "?" + params;
                        return [4, axios_1.default.get(url)];
                    case 1:
                        response = _a.sent();
                        if (response.data) {
                            if (response.data.Status === 0) {
                                if (response.data.Answer) {
                                    data = response.data.Answer;
                                    return [2, data.map(joinParts)];
                                }
                                else {
                                    throw new Error('Domain was resolved but no records were found');
                                }
                            }
                            else if (response.data.AD && question.dnssec) {
                                loglevel_1.default.warn('DNSSEC checks not implemented.');
                                return [2, []];
                            }
                            else if (response.data.Status === NXDOMAIN) {
                                throw new exceptions_1.BadDnsStatusException(response.data.Status, 'Response is NXDOMAIN');
                            }
                            else {
                                throw new exceptions_1.BadDnsStatusException(response.data.Status, 'Status from service should be 0 if resolution was successful');
                            }
                        }
                        else {
                            throw new Error('Response was empty');
                        }
                        return [2];
                }
            });
        });
    };
    return DnsClientImpl;
}());
function joinParts(item) {
    if (item.type === 5) {
        throw new exceptions_1.InvalidDnsResponseException('Found CNAME');
    }
    if (item.data.startsWith('v=spf') || item.data.startsWith('"v=spf')) {
        throw new exceptions_1.InvalidDnsResponseException('Found spf');
    }
    var joined = item.data
        .split('"')
        .filter(function (i) { return i.trim().length > 0; })
        .join('')
        .split('\\;')
        .join(';')
        .split('\\ ')
        .join(' ');
    loglevel_1.default.debug("Joined data " + joined);
    return joined;
}
//# sourceMappingURL=dnsclient.js.map