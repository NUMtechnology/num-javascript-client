export declare class NumUri {
    readonly host: Hostname;
    readonly protocol: string;
    readonly userinfo: UrlUserInfo;
    readonly port: PositiveInteger;
    readonly path: UrlPath;
    constructor(host: Hostname, port?: PositiveInteger, userinfo?: UrlUserInfo, path?: UrlPath);
    get numId(): string;
    withHost(host: Hostname): NumUri;
    withPort(port: PositiveInteger): NumUri;
    withPath(path: UrlPath): NumUri;
    withUserinfo(userinfo: UrlUserInfo): NumUri;
}
export declare function buildNumUri(host: string, port?: number, userinfo?: string, path?: string): NumUri;
export declare function parseNumUri(uri: string): NumUri;
export declare class PositiveInteger {
    readonly n: number;
    constructor(n: number);
}
export declare const MODULE_0: PositiveInteger;
export declare const MODULE_1: PositiveInteger;
export declare const MODULE_2: PositiveInteger;
export declare const MODULE_3: PositiveInteger;
export declare const MODULE_4: PositiveInteger;
export declare const MODULE_5: PositiveInteger;
export declare const MODULE_6: PositiveInteger;
export declare const MODULE_7: PositiveInteger;
export declare const MODULE_8: PositiveInteger;
export declare const MODULE_9: PositiveInteger;
export declare const MODULE_10: PositiveInteger;
export declare class Hostname {
    readonly s: string;
    constructor(s: string);
    static isValid(s: string): boolean;
}
export declare class UrlPath {
    readonly s: string;
    constructor(s: string);
}
export declare const NO_PATH: UrlPath;
export declare class UrlUserInfo {
    readonly s: string;
    constructor(s: string);
}
export declare const NO_USER_INFO: UrlUserInfo;
