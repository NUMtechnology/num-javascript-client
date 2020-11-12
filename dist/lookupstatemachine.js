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
exports.createLookupLocationStateMachine = void 0;
var context_1 = require("./context");
var loglevel_1 = __importDefault(require("loglevel"));
var delay_1 = __importDefault(require("delay"));
function createLookupLocationStateMachine(delays) {
    return new LookupLocationStateMachineImpl(delays);
}
exports.createLookupLocationStateMachine = createLookupLocationStateMachine;
var LookupState;
(function (LookupState) {
    LookupState["INDY1"] = "INDY1";
    LookupState["INDY2"] = "INDY2";
    LookupState["HOSTED1"] = "HOSTED1";
    LookupState["HOSTED2"] = "HOSTED2";
    LookupState["POP0"] = "POP0";
    LookupState["POP1"] = "POP1";
    LookupState["POP2"] = "POP2";
    LookupState["POP3"] = "POP3";
    LookupState["POP4"] = "POP4";
    LookupState["POP5"] = "POP5";
    LookupState["POP6"] = "POP6";
    LookupState["POP7"] = "POP7";
    LookupState["POP8"] = "POP8";
    LookupState["ERROR"] = "ERROR";
    LookupState["SUCCESS"] = "SUCCESS";
})(LookupState || (LookupState = {}));
var DEFAULT_DELAYS = [2000, 2000, 2000, 2000, 5000, 5000, 5000, 5000];
var LookupLocationStateMachineImpl = (function () {
    function LookupLocationStateMachineImpl(delays) {
        this.state = LookupState.INDY1;
        this.delays = delays ? DEFAULT_DELAYS.map(function (n, i) { return (i < delays.length ? delays[i] : n); }) : DEFAULT_DELAYS;
    }
    LookupLocationStateMachineImpl.prototype.complete = function () {
        return this.state === LookupState.SUCCESS || this.state === LookupState.ERROR;
    };
    LookupLocationStateMachineImpl.prototype.step = function (lookupResult) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        loglevel_1.default.debug('LookupLocationStateMachine - before step: ' + this.state);
                        if (!(typeof lookupResult === 'boolean' && lookupResult === true)) return [3, 1];
                        _a = this.success();
                        return [3, 3];
                    case 1: return [4, this.fail(lookupResult)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        result = _a;
                        loglevel_1.default.debug('LookupLocationStateMachine - after step: ' + this.state);
                        return [2, result];
                }
            });
        });
    };
    LookupLocationStateMachineImpl.prototype.success = function () {
        var result;
        switch (this.state) {
            case LookupState.INDY1:
            case LookupState.INDY2:
                result = context_1.Location.INDEPENDENT;
                break;
            case LookupState.HOSTED1:
            case LookupState.HOSTED2:
                result = context_1.Location.HOSTED;
                break;
            case LookupState.ERROR:
                result = context_1.Location.NONE;
                break;
            default:
                result = context_1.Location.POPULATOR;
        }
        this.state = LookupState.SUCCESS;
        return result;
    };
    LookupLocationStateMachineImpl.prototype.fail = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.state;
                        switch (_a) {
                            case LookupState.INDY1: return [3, 1];
                            case LookupState.HOSTED1: return [3, 2];
                            case LookupState.POP0: return [3, 3];
                            case LookupState.POP1: return [3, 5];
                            case LookupState.POP2: return [3, 7];
                            case LookupState.POP3: return [3, 9];
                            case LookupState.POP4: return [3, 11];
                            case LookupState.POP5: return [3, 13];
                            case LookupState.POP6: return [3, 15];
                            case LookupState.POP7: return [3, 17];
                            case LookupState.SUCCESS: return [3, 19];
                            case LookupState.POP8: return [3, 20];
                            case LookupState.INDY2: return [3, 20];
                            case LookupState.HOSTED2: return [3, 20];
                            case LookupState.ERROR: return [3, 20];
                        }
                        return [3, 21];
                    case 1:
                        this.state = LookupState.HOSTED1;
                        return [2, context_1.Location.HOSTED];
                    case 2:
                        this.state = LookupState.POP0;
                        return [2, context_1.Location.POPULATOR];
                    case 3: return [4, this.checkStatus(result)];
                    case 4:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 5:
                        this.state = LookupState.POP2;
                        return [4, delay_1.default(this.delays[0])];
                    case 6:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 7:
                        this.state = LookupState.POP3;
                        return [4, delay_1.default(this.delays[1])];
                    case 8:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 9:
                        this.state = LookupState.POP4;
                        return [4, delay_1.default(this.delays[2])];
                    case 10:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 11:
                        this.state = LookupState.POP5;
                        return [4, delay_1.default(this.delays[4])];
                    case 12:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 13:
                        this.state = LookupState.POP6;
                        return [4, delay_1.default(this.delays[5])];
                    case 14:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 15:
                        this.state = LookupState.POP7;
                        return [4, delay_1.default(this.delays[6])];
                    case 16:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 17:
                        this.state = LookupState.POP8;
                        return [4, delay_1.default(this.delays[7])];
                    case 18:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 19: return [3, 22];
                    case 20:
                        this.state = LookupState.ERROR;
                        return [2, context_1.Location.NONE];
                    case 21: throw new Error("Invalid LookupState status: " + this.state);
                    case 22: return [2, context_1.Location.NONE];
                }
            });
        });
    };
    LookupLocationStateMachineImpl.prototype.checkStatus = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = result;
                        switch (_a) {
                            case 1: return [3, 1];
                            case 2: return [3, 3];
                            case 3: return [3, 4];
                            case 4: return [3, 5];
                            case false: return [3, 5];
                        }
                        return [3, 5];
                    case 1:
                        this.state = LookupState.POP1;
                        return [4, delay_1.default(this.delays[3])];
                    case 2:
                        _b.sent();
                        return [2, context_1.Location.POPULATOR];
                    case 3:
                        this.state = LookupState.INDY2;
                        return [2, context_1.Location.INDEPENDENT];
                    case 4:
                        this.state = LookupState.HOSTED2;
                        return [2, context_1.Location.HOSTED];
                    case 5:
                        this.state = LookupState.ERROR;
                        return [2, context_1.Location.NONE];
                }
            });
        });
    };
    return LookupLocationStateMachineImpl;
}());
//# sourceMappingURL=lookupstatemachine.js.map