export declare class NumException extends Error {
    constructor(msg?: string);
}
export declare class NumInvalidParameterException extends NumException {
    constructor(msg?: string);
}
export declare class NumBadUrlException extends NumException {
    constructor(msg: string, _cause: Error);
}
export declare class NumInvalidDnsQueryException extends NumException {
    constructor(msg?: string);
}
export declare class NumNotImplementedException extends NumException {
    constructor(msg?: string);
}
export declare class NumInvalidRedirectException extends NumException {
    constructor(msg?: string);
}
export declare class BadDnsStatusException extends NumException {
    readonly status: number;
    constructor(status: number, msg: string);
}
export declare class InvalidDnsResponseException extends NumException {
    constructor(msg?: string);
}
export declare class RrSetHeaderFormatException extends NumException {
    constructor(msg?: string);
}
export declare class RrSetIncompleteException extends NumException {
    constructor(msg: string);
}
export declare class NumMaximumRedirectsExceededException extends NumException {
    constructor(msg?: string);
}
export declare class RelativePathException extends NumException {
    constructor(msg?: string);
}
export declare class NumLookupRedirect extends NumException {
    constructor(msg?: string);
}
