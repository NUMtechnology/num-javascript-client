import { createLookupLocationStateMachine } from './lookupstatemachine';
import { Context, Location } from './context';
import { createDnsServices, DnsServices } from './dnsservices';
import { DnsClient } from './dnsclient';
import { NumUri, PositiveInteger } from './numuri';
import { NumLookupRedirect, NumMaximumRedirectsExceededException } from './exceptions';
import { createModlServices, ModlServices } from './modlservices';
import log from 'loglevel';

const INTERPRETER_TIMEOUT_MS = 2000;
const MODULE_PREFIX = '*load=`https://modules.numprotocol.com/';
const MODULE_SUFFIX = '/rcf.txt`';

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
 * Creates client
 * @returns client
 */
export function createClient(dnsClient?: DnsClient): NumClient {
  return new NumClientImpl(dnsClient);
}

/**
 * Num client impl
 */
class NumClientImpl implements NumClient {
  readonly dnsServices: DnsServices;
  readonly modlServices: ModlServices;

  constructor(dnsClient?: DnsClient) {
    this.dnsServices = createDnsServices(dnsClient);
    this.modlServices = createModlServices();
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
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx, handler);
        if (modl) {
          const json = await this.interpret(modl, ctx.numAddress.port);
          if (json) {
            handler.setResult(json);
          }
          return json;
        }
        return null;
      } catch (e) {
        if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = Location.NONE;
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = Location.INDEPENDENT;
          ctx.handleQueryRedirect(e.message);
        }
      }
    }
  }

  /**
   * Retrieves raw MODL record - i.e. not interpreted
   * @param ctx
   * @param handler
   * @returns modl record
   */
  async retrieveModlRecord(ctx: Context, handler: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx, handler);
        if (modl) {
          // We need to interpret the record to check for redirects, but we ignore the result.
          await this.interpret(modl, ctx.numAddress.port);
          handler.setResult(modl);
          return modl;
        }
        return null;
      } catch (e) {
        if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = Location.NONE;
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = Location.INDEPENDENT;
          ctx.handleQueryRedirect(e.message);
        }
      }
    }
  }

  /**
   * Retrieves modl record internal
   * @param ctx
   * @param handler
   * @returns modl record internal
   */
  private async retrieveModlRecordInternal(ctx: Context, _handler: CallbackHandler): Promise<string | null> {
    // Use a lambda to query the DNS
    const query = async () => {
      switch (ctx.location) {
        case Location.INDEPENDENT:
          return await this.dnsQuery(ctx.queries.independentRecordLocation, ctx);
        case Location.HOSTED:
          return await this.dnsQuery(ctx.queries.hostedRecordLocation, ctx);
        case Location.POPULATOR:
          return await this.populatorQuery(ctx);
        case Location.NONE:
        default:
          return false;
      }
    };

    // Step through the state machine, querying DNS as we go.
    const sm = createLookupLocationStateMachine();
    while (!sm.complete()) {
      const result = await query();
      ctx.location = await sm.step(result);
    }

    return ctx.result;
  }

  /**
   * Interprets a MODL record for the given module
   * @param modl
   * @param port
   * @returns interpret
   */
  private async interpret(modl: string, port: PositiveInteger): Promise<string | null> {
    const enhancedModl = `${MODULE_PREFIX}${port.n}${MODULE_SUFFIX};${modl}`;
    return await this.modlServices.interpretNumRecord(enhancedModl, INTERPRETER_TIMEOUT_MS);
  }

  /**
   * Independent or Hosted query
   * @returns
   */
  private async dnsQuery(query: string, ctx: Context) {
    const result = await this.dnsServices.getRecordFromDns(query, false);
    if (result.length > 0) {
      ctx.result = result;
      return true;
    }
    return false;
  }

  /**
   * Populator query
   * @returns
   */
  private async populatorQuery(ctx: Context) {
    const populatorLocation = ctx.queries.populatorLocation;

    if (populatorLocation) {
      const result = await this.dnsServices.getRecordFromDns(populatorLocation, false);

      // Return the status_ code or false for error_ otherwise true
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
      } else if (result.includes('error_')) {
        return false;
      } else {
        ctx.result = await this.interpret(result, ctx.numAddress.port);
        return true;
      }
    }
    return false;
  }
}
