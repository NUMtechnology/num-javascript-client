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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDnsServices = void 0;
var dnsclient_1 = require("./dnsclient");
var loglevel_1 = __importDefault(require("loglevel"));
var exceptions_1 = require("./exceptions");
var MATCH_MULTIPART_RECORD_FRAGMENT = /(^\d+\|.*)|(\d+\/\d+\|@n=\d+;.*)/;
function createDnsServices(dnsClient) {
    return new DnsServicesImpl(dnsClient);
}
exports.createDnsServices = createDnsServices;
var DnsServicesImpl = (function () {
    function DnsServicesImpl(dnsClient) {
        this.dnsClient = dnsClient ? dnsClient : dnsclient_1.createDnsClient();
    }
    DnsServicesImpl.prototype.rebuildTxtRecordContent = function (records) {
        var e_1, _a, e_2, _b;
        var ordered = new Map();
        if (records) {
            var total = records.length;
            var skipped = 0;
            try {
                for (var records_1 = __values(records), records_1_1 = records_1.next(); !records_1_1.done; records_1_1 = records_1.next()) {
                    var data = records_1_1.value;
                    if (MATCH_MULTIPART_RECORD_FRAGMENT.test(data)) {
                        var pipeIndex = data.indexOf('|');
                        if (pipeIndex >= 0) {
                            var parts = [data.substring(0, pipeIndex), data.substring(pipeIndex + 1)];
                            var dataMinusHeader = data.substring(parts[0].length + 1);
                            if (parts[0].includes('/')) {
                                ordered.set(0, dataMinusHeader);
                                var firstParts = parts[0].split('/');
                                if (firstParts.length === 2) {
                                    total = parseInt(firstParts[1], 10);
                                    if (isNaN(total)) {
                                        throw new exceptions_1.RrSetHeaderFormatException("Could not parse total parts " + firstParts[1]);
                                    }
                                }
                                else {
                                    throw new exceptions_1.RrSetHeaderFormatException('First part should only contain 1 "/", format is incorrect!');
                                }
                            }
                            else {
                                var index = parseInt(parts[0], 10);
                                if (isNaN(index)) {
                                    throw new exceptions_1.RrSetHeaderFormatException("Could not parse index " + parts[0]);
                                }
                                ordered.set(index - 1, dataMinusHeader);
                            }
                        }
                    }
                    else {
                        if (records.length === 1) {
                            ordered.set(0, data);
                        }
                        else {
                            skipped++;
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (records_1_1 && !records_1_1.done && (_a = records_1.return)) _a.call(records_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (total !== records.length - skipped) {
                var msg = skipped === 1
                    ? "Parts and records length do not match, found " + total + " records but 1 could not be identified as a NUM record fragment."
                    : "Parts and records length do not match, found " + total + " records but " + skipped + " could not be identified as NUM record fragments.";
                throw new exceptions_1.RrSetIncompleteException(msg);
            }
            var sortedKeys = __spread(ordered.keys()).sort(function (a, b) { return a - b; });
            var buffer = '';
            try {
                for (var sortedKeys_1 = __values(sortedKeys), sortedKeys_1_1 = sortedKeys_1.next(); !sortedKeys_1_1.done; sortedKeys_1_1 = sortedKeys_1.next()) {
                    var k = sortedKeys_1_1.value;
                    buffer += ordered.get(k);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (sortedKeys_1_1 && !sortedKeys_1_1.done && (_b = sortedKeys_1.return)) _b.call(sortedKeys_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return buffer;
        }
        return '';
    };
    DnsServicesImpl.prototype.getRecordFromDns = function (query, checkDnsSecValidity) {
        return __awaiter(this, void 0, void 0, function () {
            var question, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        question = new dnsclient_1.Question(query, 'TXT', checkDnsSecValidity);
                        return [4, this.dnsClient.query(question)];
                    case 1:
                        result = _a.sent();
                        loglevel_1.default.debug("Performed dns lookup " + JSON.stringify(question) + " and got " + JSON.stringify(result));
                        return [2, this.rebuildTxtRecordContent(result)];
                }
            });
        });
    };
    return DnsServicesImpl;
}());
//# sourceMappingURL=dnsservices.js.map