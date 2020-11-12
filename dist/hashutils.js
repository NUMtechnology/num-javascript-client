"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashByDepth = void 0;
var crypto_js_1 = __importDefault(require("crypto-js"));
var any_base_1 = __importDefault(require("any-base"));
var hexToBase36 = any_base_1.default(any_base_1.default.HEX, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
function hashByDepth(normalisedDomain, depth) {
    var hashed = crypto_js_1.default.SHA1(normalisedDomain).toString();
    var converted = hexToBase36(hashed).toLowerCase();
    var dottedHashByDepth = '';
    for (var i = depth - 1; i >= 0; i--) {
        dottedHashByDepth += "." + converted[i];
    }
    return dottedHashByDepth;
}
exports.hashByDepth = hashByDepth;
//# sourceMappingURL=hashutils.js.map