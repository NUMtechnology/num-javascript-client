const DOMAIN_REGEX = new RegExp(/^(([^.\s\\\b]+?\.)*?([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?\.)([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?))\.??$/);
const USERINFO_REGEX = new RegExp(/^(?!\s)[^@\f\t\r\b\n]+?(?<!\s)$/);
const PATH_REGEX = new RegExp(/^(\/[^;,/\\?:@&=+$.#\s]+)*\/?$/);
const MAX_LABEL_LENGTH = 63;
const MAX_DOMAIN_NAME_LENGTH = 253;
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Num uri
 */
export class NumUri {
  readonly protocol: string;
  readonly userinfo: UrlUserInfo;
  readonly port: PositiveInteger;
  readonly path: UrlPath;

  /**
   * Creates an instance of num uri.
   * @param userinfo
   * @param host
   * @param port
   * @param path
   */
  constructor(readonly host: Hostname, port?: PositiveInteger, userinfo?: UrlUserInfo, path?: UrlPath) {
    this.protocol = 'num';
    this.userinfo = userinfo ? userinfo : NO_USER_INFO;
    this.port = port ? port : MODULE_0;
    this.path = path ? path : NO_PATH;
  }

  /**
   * Gets num id
   */
  get numId(): string {
    if (this.userinfo.s !== '') {
      return `${this.userinfo.s}@${this.host.s}${this.path.s}`;
    }
    return `${this.host.s}${this.path.s}`;
  }
}

/**
 * Creates num uri
 * @param host
 * @param [port]
 * @param [userinfo]
 * @param [path]
 * @returns num uri
 */
export function buildNumUri(host: string, port?: number, userinfo?: string, path?: string): NumUri {
  const thePort = port ? new PositiveInteger(port) : MODULE_0;
  const theUserInfo = userinfo ? new UrlUserInfo(userinfo) : NO_USER_INFO;
  const thePath = path ? new UrlPath(path) : NO_PATH;
  return new NumUri(new Hostname(host), thePort, theUserInfo, thePath);
}

/**
 * Parses num uri
 * @param uri
 * @returns num uri
 */
export function parseNumUri(uri: string): NumUri {
  const protocolPrefix = uri.indexOf('://');
  const withoutProtocol = protocolPrefix > -1 ? uri.substr(protocolPrefix + 3) : uri;
  const indexOfAt = withoutProtocol.indexOf('@');
  const withoutUserInfo = indexOfAt > -1 ? withoutProtocol.substr(indexOfAt + 1) : withoutProtocol;
  const pathSeparator = withoutUserInfo.indexOf('/');
  const withoutPath = pathSeparator > -1 ? withoutUserInfo.substr(0, pathSeparator) : withoutUserInfo;
  const portSeparator = withoutPath.indexOf(':');
  const withoutPort = portSeparator > -1 ? withoutPath.substr(0, portSeparator) : withoutPath;

  const portString = withoutPath.substr(portSeparator + 1);
  const portNumber = portString.length > 0 ? Number.parseInt(portString, 10) : 0;
  const port = portSeparator > -1 ? new PositiveInteger(portNumber) : MODULE_0;
  const userInfo = indexOfAt > -1 ? new UrlUserInfo(withoutProtocol.substr(0, indexOfAt)) : NO_USER_INFO;
  const host = new Hostname(withoutPort);
  const path = pathSeparator > -1 ? new UrlPath(withoutUserInfo.substr(pathSeparator)) : NO_PATH;

  return new NumUri(host, port, userInfo, path);
}

/**
 * Positive integer
 */
export class PositiveInteger {
  /**
   * Creates an instance of positive integer.
   * @param n
   */
  constructor(readonly n: number) {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error(`Value should be zero or a positive integer: ${n}`);
    }
  }
}

export const MODULE_0 = new PositiveInteger(0);
export const MODULE_1 = new PositiveInteger(1);
export const MODULE_2 = new PositiveInteger(2);
export const MODULE_3 = new PositiveInteger(3);
export const MODULE_4 = new PositiveInteger(4);
export const MODULE_5 = new PositiveInteger(5);
export const MODULE_6 = new PositiveInteger(6);
export const MODULE_7 = new PositiveInteger(7);
export const MODULE_8 = new PositiveInteger(8);
export const MODULE_9 = new PositiveInteger(9);
export const MODULE_10 = new PositiveInteger(10);

/**
 * Hostname
 */
export class Hostname {
  /**
   * Creates an instance of hostname.
   * @param s
   */
  constructor(readonly s: string) {
    if (s.length > MAX_DOMAIN_NAME_LENGTH || !s.match(DOMAIN_REGEX)) {
      throw new Error(`Invalid domain name: '${s}'`);
    }
    s.split('.').forEach((i) => {
      if (i.length > MAX_LABEL_LENGTH) {
        throw new Error(`Invalid domain name: '${s}'`);
      }
    });
  }
}

/**
 * Url path
 */
export class UrlPath {
  /**
   * Creates an instance of url path.
   * @param s
   */
  constructor(readonly s: string) {
    if (!s.startsWith('/') || !s.match(PATH_REGEX)) {
      throw new Error(`Invalid URL path: '${s}'`);
    }
    if (s !== '/') {
      // Check each path component
      s.substr(1)
        .split('/')
        .forEach((pc) => {
          if (pc.length === 0) {
            throw new Error(`Invalid URL path: '${s}' - zero length path component`);
          }
          if (pc.length > MAX_LABEL_LENGTH) {
            throw new Error(`Invalid URL path: '${pc}' - path component too long`);
          }
          if (pc.includes(' ')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains space`);
          }
          if (pc.includes('\n')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains newline`);
          }
          if (pc.includes('\r')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains carriage return`);
          }
          if (pc.includes('\t')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains tab`);
          }
          if (pc.includes('\b')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains backspace`);
          }
          if (pc.includes('\f')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains formfeed`);
          }
        });
    }
  }
}

export const NO_PATH = new UrlPath('/');

/**
 * Url user info
 */
export class UrlUserInfo {
  /**
   * Creates an instance of url user info.
   * @param s
   */
  constructor(readonly s: string) {
    if (
      (s && s.length > 0 && !s.match(USERINFO_REGEX)) ||
      s.length > MAX_LOCAL_PART_LENGTH ||
      s.startsWith('.') ||
      s.endsWith('.') ||
      s.includes('..') ||
      s.includes('\\') ||
      s.includes('\n') ||
      s.includes('\r') ||
      s.includes('\t') ||
      s.includes('\b') ||
      s.includes('\f')
    ) {
      throw new Error(`Invalid URL userinfo: ${s}`);
    }
  }
}

export const NO_USER_INFO = new UrlUserInfo('');
