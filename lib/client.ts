const DOMAIN_REGEX = new RegExp(
  /^(([^.\s\\\b]+?\.)*?([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?\.)([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?))\.??$/
);
const USERINFO_REGEX = new RegExp(/^(?!\s)[^@\f\t\r\b\n]+?(?<!\s)$/);
const PATH_REGEX = new RegExp(/^(\/[^;,/\\?:@&=+$.#\s]+)*\/?$/);
const MAX_LABEL_LENGTH = 63;
const MAX_DOMAIN_NAME_LENGTH = 253;
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Num client
 */
export interface NumClient {
  /**
   * Begins num client
   * @param numAddress
   * @param handler
   * @returns begin
   */
  begin(numAddress: NumUri, handler: CallbackHandler): Context;
  /**
   * Retrieves num record
   * @param ctx
   * @param handler
   * @returns num record
   */
  retrieveNumRecord(ctx: Context, handler: CallbackHandler): string | null;
}

/**
 * Location
 */
export enum Location {
  LOCATION_HOSTED,
  LOCATION_INDEPENDENT,
  LOCATION_POPULATOR,
  LOCATION_STOP,
}

/**
 * Num uri
 */
export class NumUri {
  readonly protocol: string;
  /**
   * Creates an instance of num uri.
   * @param userinfo
   * @param host
   * @param port
   * @param path
   */
  constructor(
    readonly userinfo: UrlUserInfo,
    readonly host: Hostname,
    readonly port: PositiveInteger,
    readonly path: UrlPath
  ) {
    this.protocol = 'num';
  }
}

/**
 * Context
 */
export class Context {}

/**
 * Callback handler
 */
export interface CallbackHandler {
  /**
   *
   * @param l
   */
  setLocation(l: Location): void;
  /**
   *
   * @param r
   */
  setResult(r: string): void;
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
      throw new Error(`Invalid domain name: ${s}`);
    }
    s.split('.').forEach((i) => {
      if (i.length > MAX_LABEL_LENGTH) {
        throw new Error(`Invalid domain name: ${s}`);
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
      throw new Error(`Invalid URL path: ${s}`);
    }
    if (s !== '/') {
      // Check each path component
      s.substr(1)
        .split('/')
        .forEach((pc) => {
          if (pc.length === 0) {
            throw new Error(`Invalid URL path: ${s} - zero length path component`);
          }
          if (pc.length > MAX_LABEL_LENGTH) {
            throw new Error(`Invalid URL path: ${pc} - path component too long`);
          }
          if (pc.includes(' ')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains space`);
          }
          if (pc.includes('\n')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains newline`);
          }
          if (pc.includes('\r')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains carriage return`);
          }
          if (pc.includes('\t')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains tab`);
          }
          if (pc.includes('\b')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains backspace`);
          }
          if (pc.includes('\f')) {
            throw new Error(`Invalid URL path: ${pc} - path component contains formfeed`);
          }
        });
    }
  }
}

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

/**
 * Creates client
 * @returns client
 */
export function createClient(): NumClient {
  return new NumClientImpl();
}

/**
 * Num client impl
 */
class NumClientImpl implements NumClient {
  begin(numAddress: NumUri, handler: CallbackHandler): Context {
    throw new Error('Method not implemented.');
  }
  retrieveNumRecord(ctx: Context, handler: CallbackHandler): string | null {
    throw new Error('Method not implemented.');
  }
}
