import { createLookupLocationStateMachine } from './lookupstatemachine';
import { Context, Location } from './context';
import log from 'loglevel';
import { createDnsServices, DnsServices } from './dnsservices';
import { DnsClient } from './dnsclient';

const DOMAIN_REGEX = new RegExp(/^(([^.\s\\\b]+?\.)*?([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?\.)([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?))\.??$/);
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
   *
   * @param numAddress
   * @returns begin
   */
  begin(numAddress: NumUri): Context;

  /**
   *
   * @param ctx
   * @param handler
   * @returns num record
   */
  retrieveNumRecord(ctx: Context, handler: CallbackHandler): Promise<string | null>;

  /**
   *
   * @param ctx
   * @param handler
   * @returns MODL record
   */
  retrieveModlRecord(ctx: Context, handler: CallbackHandler): Promise<string | null>;
}

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
 * Creates default callback handler
 * @returns default callback handler
 */
export function createDefaultCallbackHandler(): CallbackHandler {
  return new DefaultCallbackHandler();
}

/**
 * Default callback handler
 */
class DefaultCallbackHandler implements CallbackHandler {
  private location: Location | null = null;
  private result: string | null = null;

  /**
   * Sets location
   * @param l
   */
  setLocation(l: Location): void {
    this.location = l;
  }

  /**
   * Sets result
   * @param r
   */
  setResult(r: string): void {
    this.result = r;
  }

  /**
   * Gets location
   * @returns location
   */
  getLocation(): Location | null {
    return this.location;
  }

  /**
   * Gets result
   * @returns result
   */
  getResult(): string | null {
    return this.result;
  }
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
  readonly dnsServices: DnsServices;

  constructor(dnsClient?: DnsClient) {
    this.dnsServices = createDnsServices(dnsClient);
  }
  /**
   * Creates an instance of num client impl.
   * @param numAddress
   */
  begin(numAddress: NumUri): Context {
    return new Context(numAddress);
  }

  /**
   * Retrieves num record and interprets it to JSON
   * @param ctx
   * @param handler
   * @returns num record
   */
  async retrieveNumRecord(ctx: Context, handler: CallbackHandler): Promise<string | null> {
    const modl = await this.retrieveModlRecordInternal(ctx, handler);
    if (modl) {
      const json = this.interpret(modl, ctx.numAddress.port);
      if (json) {
        handler.setResult(json);
      }
      return json;
    }
    return null;
  }

  /**
   * Retrieves raw MODL record - i.e. not interpreted
   * @param ctx
   * @param handler
   * @returns modl record
   */
  async retrieveModlRecord(ctx: Context, handler: CallbackHandler): Promise<string | null> {
    const modl = await this.retrieveModlRecordInternal(ctx, handler);
    if (modl) {
      handler.setResult(modl);
    }
    return modl;
  }

  /**
   * Retrieves modl record internal
   * @param ctx
   * @param handler
   * @returns modl record internal
   */
  private async retrieveModlRecordInternal(ctx: Context, _handler: CallbackHandler): Promise<string | null> {
    const sm = createLookupLocationStateMachine();

    // Use a lambda to query the DNS
    const query = async () => {
      switch (ctx.location) {
        case Location.INDEPENDENT:
          return await this.independentQuery(ctx);
        case Location.HOSTED:
          return await this.hostedQuery(ctx);
        case Location.POPULATOR:
          return await this.populatorQuery(ctx);
        case Location.NONE:
        default:
          return 0;
      }
    };

    // Step through the state machine, querying DNS as we go.
    while (!sm.complete()) {
      const result = await query();
      await sm.step(result, ctx);
    }

    return ctx.result;
  }

  /**
   * Interprets a MODL record for the given module
   * @param modl
   * @param port
   * @returns interpret
   */
  private interpret(modl: string, _port: PositiveInteger): string | null {
    return modl;
  }

  /**
   * Independents query
   * @returns
   */
  private async independentQuery(ctx: Context) {
    log.info('independentQuery');
    const result = await this.queryDns(ctx.queries.independentRecordLocation);
    if (result.length > 0) {
      ctx.result = result;
      return true;
    }
    return false;
  }

  /**
   * Hosted query
   * @returns
   */
  private async hostedQuery(ctx: Context) {
    log.info('hostedQuery');
    const result = await this.queryDns(ctx.queries.hostedRecordLocation);
    if (result.length > 0) {
      ctx.result = result;
      return true;
    }
    return false;
  }

  /**
   * Populators query
   * @returns
   */
  private async populatorQuery(ctx: Context) {
    log.info('populatorQuery');
    const populatorLocation = ctx.queries.populatorLocation;

    if (populatorLocation) {
      const result = await this.queryDns(populatorLocation);
      if (result.includes('status_')) {
        if (result.includes('code=1')) {
          return 1;
        } else if (result.includes('code=2')) {
          return 2;
        } else if (result.includes('code=3')) {
          return 3;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Querys dns
   * @param query
   * @returns dns
   */
  private async queryDns(query: string): Promise<string> {
    log.info(`Querying: ${query}`);
    return await this.dnsServices.getRecordFromDns(query, false);
  }
}
