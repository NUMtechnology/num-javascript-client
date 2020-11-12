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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumLookupRedirect = exports.RelativePathException = exports.NumMaximumRedirectsExceededException = exports.RrSetIncompleteException = exports.RrSetHeaderFormatException = exports.InvalidDnsResponseException = exports.BadDnsStatusException = exports.NumInvalidRedirectException = exports.NumNotImplementedException = exports.NumInvalidDnsQueryException = exports.NumBadUrlException = exports.NumInvalidParameterException = exports.NumException = void 0;
var NumException = (function (_super) {
    __extends(NumException, _super);
    function NumException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumException;
}(Error));
exports.NumException = NumException;
var NumInvalidParameterException = (function (_super) {
    __extends(NumInvalidParameterException, _super);
    function NumInvalidParameterException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumInvalidParameterException;
}(NumException));
exports.NumInvalidParameterException = NumInvalidParameterException;
var NumBadUrlException = (function (_super) {
    __extends(NumBadUrlException, _super);
    function NumBadUrlException(msg, _cause) {
        return _super.call(this, msg) || this;
    }
    return NumBadUrlException;
}(NumException));
exports.NumBadUrlException = NumBadUrlException;
var NumInvalidDnsQueryException = (function (_super) {
    __extends(NumInvalidDnsQueryException, _super);
    function NumInvalidDnsQueryException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumInvalidDnsQueryException;
}(NumException));
exports.NumInvalidDnsQueryException = NumInvalidDnsQueryException;
var NumNotImplementedException = (function (_super) {
    __extends(NumNotImplementedException, _super);
    function NumNotImplementedException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumNotImplementedException;
}(NumException));
exports.NumNotImplementedException = NumNotImplementedException;
var NumInvalidRedirectException = (function (_super) {
    __extends(NumInvalidRedirectException, _super);
    function NumInvalidRedirectException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumInvalidRedirectException;
}(NumException));
exports.NumInvalidRedirectException = NumInvalidRedirectException;
var BadDnsStatusException = (function (_super) {
    __extends(BadDnsStatusException, _super);
    function BadDnsStatusException(status, msg) {
        var _this = _super.call(this, msg) || this;
        _this.status = status;
        return _this;
    }
    return BadDnsStatusException;
}(NumException));
exports.BadDnsStatusException = BadDnsStatusException;
var InvalidDnsResponseException = (function (_super) {
    __extends(InvalidDnsResponseException, _super);
    function InvalidDnsResponseException(msg) {
        return _super.call(this, msg) || this;
    }
    return InvalidDnsResponseException;
}(NumException));
exports.InvalidDnsResponseException = InvalidDnsResponseException;
var RrSetHeaderFormatException = (function (_super) {
    __extends(RrSetHeaderFormatException, _super);
    function RrSetHeaderFormatException(msg) {
        return _super.call(this, msg) || this;
    }
    return RrSetHeaderFormatException;
}(NumException));
exports.RrSetHeaderFormatException = RrSetHeaderFormatException;
var RrSetIncompleteException = (function (_super) {
    __extends(RrSetIncompleteException, _super);
    function RrSetIncompleteException(msg) {
        return _super.call(this, msg) || this;
    }
    return RrSetIncompleteException;
}(NumException));
exports.RrSetIncompleteException = RrSetIncompleteException;
var NumMaximumRedirectsExceededException = (function (_super) {
    __extends(NumMaximumRedirectsExceededException, _super);
    function NumMaximumRedirectsExceededException(msg) {
        return _super.call(this, msg) || this;
    }
    return NumMaximumRedirectsExceededException;
}(NumException));
exports.NumMaximumRedirectsExceededException = NumMaximumRedirectsExceededException;
var RelativePathException = (function (_super) {
    __extends(RelativePathException, _super);
    function RelativePathException(msg) {
        return _super.call(this, msg) || this;
    }
    return RelativePathException;
}(NumException));
exports.RelativePathException = RelativePathException;
var NumLookupRedirect = (function (_super) {
    __extends(NumLookupRedirect, _super);
    function NumLookupRedirect(msg) {
        return _super.call(this, msg) || this;
    }
    return NumLookupRedirect;
}(NumException));
exports.NumLookupRedirect = NumLookupRedirect;
//# sourceMappingURL=exceptions.js.map