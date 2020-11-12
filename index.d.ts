/**
 * Creates client
 * @param [dnsClient]
 * @returns client
 */
export function createClient(dnsClient?: DnsClient): NumClient;
/**
 * Num client
 */
export interface NumClient {
  /**
   *
   * @param numAddress
   * @returns Context
   */
  createContext(numAddress: NumUri): Context;

  /**
   * Returns a fully interpreted NUM record as a JSON string
   * @param ctx
   * @param handler
   * @returns num record
   */
  retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;

  /**
   * Returns the raw MODL record, after redirection if appropriate
   * @param ctx
   * @param handler
   * @returns MODL record
   */
  retrieveModlRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;
}

/**
 * Callback handler - these methods are invoked when the lookup is complete.
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
 * Creates default callback handler
 * @returns default callback handler
 */
export function createDefaultCallbackHandler(): CallbackHandler;

/**
 * DoHresolver
 */
export declare class DoHResolver {
  constructor(readonly name: string, readonly url: string);
}

/**
 * Question
 */
export declare class Question {
  readonly name: string;
  readonly type: number | string;
  readonly dnssec: boolean;

  constructor(name: string, type: number | string, dnssec: boolean);
}

/**
 * Dns client
 */
export interface DnsClient {
  /**
   *
   * @param question
   * @returns query
   */
  query(question: Question): Promise<string[]>;
}

/**
 * Creates dns client
 * @param [resolver]
 * @returns dns client
 */
export function createDnsClient(resolver?: DoHResolver): DnsClient;

/**
 * Num uri
 */
export declare class NumUri {
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
  constructor(readonly host: Hostname, port?: PositiveInteger, userinfo?: UrlUserInfo, path?: UrlPath);

  /**
   * Gets num id without the port/module number
   */
  get numId(): string;

  /**
   * Withs host
   * @param host
   * @returns host
   */
  withHost(host: Hostname): NumUri;

  /**
   * Withs port
   * @param port
   * @returns port
   */
  withPort(port: PositiveInteger): NumUri;

  /**
   * Withs path
   * @param path
   * @returns path
   */
  withPath(path: UrlPath): NumUri;

  /**
   * Withs userinfo
   * @param userinfo
   * @returns userinfo
   */
  withUserinfo(userinfo: UrlUserInfo): NumUri;
}

/**
 * Creates num uri
 * @param host
 * @param [port]
 * @param [userinfo]
 * @param [path]
 * @returns num uri
 */
export function buildNumUri(host: string, port?: number, userinfo?: string, path?: string): NumUri;

/**
 * Parses num uri
 * @param uri
 * @returns num uri
 */
export function parseNumUri(uri: string): NumUri;

/**
 * Positive integer
 */
export declare class PositiveInteger {
  /**
   * Creates an instance of positive integer.
   * @param n
   */
  constructor(readonly n: number);
}

export const MODULE_0;
export const MODULE_1;
export const MODULE_2;
export const MODULE_3;
export const MODULE_4;
export const MODULE_5;
export const MODULE_6;
export const MODULE_7;
export const MODULE_8;
export const MODULE_9;
export const MODULE_10;

/**
 * Hostname
 */
export declare class Hostname {
  /**
   * Creates an instance of hostname.
   * @param s
   */
  constructor(readonly s: string);

  static isValid(s: string): boolean;
}

/**
 * Url path
 */
export declare class UrlPath {
  /**
   * Creates an instance of url path.
   * @param s
   */
  constructor(readonly s: string);
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
      (notEmpty(s) && !s.match(USERINFO_REGEX)) ||
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

export type UserVariable = string | number | boolean;

/**
 * Location
 */
export declare enum Location {
  HOSTED = 'HOSTED',
  INDEPENDENT = 'INDEPENDENT',
  POPULATOR = 'POPULATOR',
  NONE = 'NONE',
}

/**
 * Context
 */
export declare class Context {
  public location: Location;
  public result: string | null;
  public readonly numAddress: NumUri;

  /**
   * Creates an instance of context.
   * @param numAddress
   */
  constructor(numAddress: NumUri);

  /**
   * Sets user variable
   * @param name
   * @param value
   */
  setUserVariable(name: string, value: UserVariable);

  /**
   * Count redirects and return the current number of redirects.
   *
   * @return the current number of redirects
   */
  incrementRedirectCount(): number;

  /**
   * Gets queries
   */
  get queries(): ModuleDnsQueries;

  /**
   * Update the relevant query for the supplied redirect
   *
   * @param redirect the supplied redirect
   * @throws NumMaximumRedirectsExceededException on Error
   * @throws NumInvalidDNSQueryException          on Error
   * @throws NumInvalidRedirectException          on Error
   */
  handleQueryRedirect(redirect: string): void;

  /**
   * Update the hosted query for the supplied redirect
   *
   * @param redirectTo the supplied redirect
   * @throws NumInvalidDNSQueryException on error
   * @throws NumInvalidRedirectException on error
   */
  handleHostedQueryRedirect(redirectTo: string): void;

  /**
   * Update the independent query for the supplied redirect
   *
   * @param redirectTo the supplied redirect
   * @throws NumInvalidDNSQueryException on error
   * @throws NumInvalidRedirectException on error
   */
  handleIndependentQueryRedirect(redirectTo: string): void;
}
