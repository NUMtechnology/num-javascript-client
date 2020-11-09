import { createLookupLocationStateMachine } from './lookupstatemachine';
import { Context, Location } from './context';
import { createDnsServices, DnsServices } from './dnsservices';
import { DnsClient } from './dnsclient';
import { NumUri, PositiveInteger } from './numuri';

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
  private interpret(modl: string, _port: PositiveInteger): string | null {
    return modl;
  }

  /**
   * Independent or Hosted query
   * @returns
   */
  private async dnsQuery(query: string, ctx: Context) {
    const result = await this.dnsServices.getRecordFromDns(query, false);
    if (result.length > 0) {
      ctx.result = this.interpret(result, ctx.numAddress.port);
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
        ctx.result = this.interpret(result, ctx.numAddress.port);
        return true;
      }
    }
    return false;
  }
}
