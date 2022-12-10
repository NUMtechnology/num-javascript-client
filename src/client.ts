// Copyright 2020 NUM Technology Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
import { Context, NumLocation } from './context';
import { DoHResolver } from './dnsclient';
import { createDnsServices, DnsServices } from './dnsservices';
import {
  NumLookupBadDoHResponse,
  NumLookupEmptyResult,
  NumLookupRedirect,
  NumMaximumRedirectsExceededException,
  NumProtocolErrorCode,
  NumProtocolException,
} from './exceptions';
import { createLookupLocationStateMachine } from './lookupstatemachine';
import { createModlServices, ModlServices } from './modlservices';
import { NumUri, parseNumUri, PositiveInteger } from './numuri';
import { log } from 'num-easy-log';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Creates client
 *
 * @returns client
 */
export const createClient = (resolvers?: Array<DoHResolver>): NumClient => new NumClientImpl(resolvers);

/**
 * Utility function for developers who just want to try out the API. Not recommended for producton use.
 */
export const lookup = (uri: string): Promise<string | null> => {
  const numUri: NumUri = parseNumUri(uri);

  const client: NumClient = createClient();
  const ctx = client.createContext(numUri);

  return client.retrieveNumRecordJson(ctx);
};

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
   *
   * @param ctx
   * @param handler
   * @returns num record
   */
  retrieveNumRecordJson(ctx: Context, handler?: CallbackHandler): Promise<string | null>;

  /**
   * Returns the raw MODL record, after redirection if appropriate
   *
   * @param ctx
   * @param handler
   * @returns MODL record
   */
  retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;

  /**
   *
   * @param modl a raw MODL string
   * @param moduleNumber a PositiveInteger module number
   */
  interpret(modl: string, moduleNumber: PositiveInteger): string | null;

  /**
   * Set a timeout for DoH requests.
   * Defaults to 500ms
   *
   * @param t the DoH request timeout in milliseconds
   */
  setTimeoutMillis(t: number): void;
}

/**
 * Callback handler - these methods are invoked when the lookup is complete.
 */
export interface CallbackHandler {
  /**
   *
   * @param l
   */
  setLocation(l: NumLocation): void;

  /**
   *
   * @param r
   */
  setResult(r: string): void;

  /**
   * Set the error code if there is one.
   *
   * @param e NumProtocolErrorCode
   */
  setErrorCode(e: NumProtocolErrorCode): void;
}

/**
 * Creates default callback handler
 *
 * @returns default callback handler
 */
export const createDefaultCallbackHandler = (): CallbackHandler => new DefaultCallbackHandler();

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

const DNS_REQUEST_TIMEOUT_MS = 500;

const DEFAULT_RESOLVERS = [new DoHResolver('Cloudflare', 'https://cloudflare-dns.com/dns-query'), new DoHResolver('Google', 'https://dns.google.com/resolve')];

//------------------------------------------------------------------------------------------------------------------------

/**
 * Default callback handler - a minimal class for responding to Callbacks from the NumClient
 */
export class DefaultCallbackHandler implements CallbackHandler {
  private location: NumLocation | null = null;
  private result: string | null = null;
  private errorCode: NumProtocolErrorCode | null = null;

  /**
   * Sets the location that a record was retrieved from.
   *
   * @param l
   */
  setLocation(l: NumLocation): void {
    this.location = l;
  }

  /**
   * Sets the NUM record that was found.
   *
   * @param r
   */
  setResult(r: string): void {
    this.result = r;
  }

  /**
   * Gets the location that the record was retrieved from.
   *
   * @returns location
   */
  getLocation(): NumLocation | null {
    return this.location;
  }

  /**
   * Gets the NUM record that was retrieved.
   *
   * @returns result
   */
  getResult(): string | null {
    return this.result;
  }

  /**
   * Set the error code if there is one.
   *
   * @param e the NumProtocolErrorCode
   */
  setErrorCode(e: NumProtocolErrorCode): void {
    this.errorCode = e;
  }

  /**
   * Get the error code or null if none.
   *
   * @returns NumProtocolErrorCode
   */
  getErrorCode(): NumProtocolErrorCode | null {
    return this.errorCode;
  }
}

/**
 * Num client impl
 */
class NumClientImpl implements NumClient {
  readonly dnsServices: DnsServices;
  readonly modlServices: ModlServices;

  /**
   * Creates an instance of num client impl.
   *
   * @param [dnsClient]
   */
  constructor(resolvers?: Array<DoHResolver>) {
    this.dnsServices =
      resolvers && resolvers.length > 0 ? createDnsServices(DNS_REQUEST_TIMEOUT_MS, resolvers) : createDnsServices(DNS_REQUEST_TIMEOUT_MS, DEFAULT_RESOLVERS);

    this.modlServices = createModlServices();
  }

  setTimeoutMillis(t: number): void {
    this.dnsServices.setTimeout(t);
  }
  /**
   * Creates an instance of num client impl.
   *
   * @param numAddress
   */
  createContext(numAddress: NumUri): Context {
    try {
      return new Context(numAddress);
    } catch (e) {
      const err = e as Error;
      throw new NumProtocolException(NumProtocolErrorCode.errorCreatingContext, err.message);
    }
  }

  /**
   * Retrieves num record and interprets it to JSON
   *
   * @param ctx
   * @param handler
   * @returns num record
   */
  async retrieveNumRecordJson(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx);
        if (modl) {
          const json = this.interpret(modl);
          if (json) {
            log.debug(`json = ${json}`);
            if (handler) {
              handler.setResult(json);
            }
          } else {
            log.debug('json = null');
          }
          return json;
        }
        handler?.setErrorCode(NumProtocolErrorCode.noModlRecordFound);
        return null;
      } catch (e) {
        if (e instanceof NumProtocolException) {
          log.error(`NumProtocolException: ${e.errorCode} : ${e.message}`);
          handler?.setErrorCode(e.errorCode);
          return null;
        } else if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = NumLocation.none;
          handler?.setErrorCode(NumProtocolErrorCode.tooManyRedirects);
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = NumLocation.independent;
          ctx.handleQueryRedirect(e.message);
        } else if (e instanceof NumLookupEmptyResult) {
          log.warn('Empty result');
          ctx.result = null;
          ctx.location = NumLocation.none;
          handler?.setErrorCode(NumProtocolErrorCode.noModlRecordFound);
          return null;
        } else if (e instanceof NumLookupBadDoHResponse) {
          log.warn('Bad DoH Service');
          ctx.location = NumLocation.none;
          handler?.setErrorCode(NumProtocolErrorCode.badDoHResponse);
          return null;
        } else if (e instanceof Error) {
          log.warn(`Unhandled exception: ${e.message}`);
          ctx.location = NumLocation.none;
          handler?.setErrorCode(NumProtocolErrorCode.noModlRecordFound);
          handler?.setErrorCode(NumProtocolErrorCode.internalError);
          return null;
        }
      }
    }
  }

  /**
   * Retrieves raw MODL record - i.e. not interpreted
   *
   * @param ctx
   * @param handler
   * @returns modl record
   */
  async retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx);
        if (modl) {
          if (handler) {
            handler.setResult(modl);
          }
          return modl;
        }
        return null;
      } catch (e) {
        if (e instanceof NumProtocolException) {
          if (handler) {
            log.error(`NumProtocolException: ${e.errorCode} : ${e.message}`);
            handler.setErrorCode(e.errorCode);
            return null;
          }
        } else if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = NumLocation.none;
          if (handler) {
            handler.setErrorCode(NumProtocolErrorCode.tooManyRedirects);
          }
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = NumLocation.independent;
          ctx.handleQueryRedirect(e.message);
        } else if (e instanceof Error) {
          log.warn(`Unhandled exception: ${e.message}`);
          if (handler) {
            handler.setErrorCode(NumProtocolErrorCode.internalError);
          }
          return null;
        }
      }
    }
  }

  /**
   * Retrieves modl record internal
   *
   * @param ctx
   * @param handler
   * @returns modl record internal
   */
  private async retrieveModlRecordInternal(ctx: Context): Promise<string | null> {
    // Use a lambda to query the DNS
    const query = async () => {
      switch (ctx.location) {
        case NumLocation.independent:
          return this.dnsQuery(ctx.queries.independentRecordLocation, ctx);
        case NumLocation.hosted:
          return this.dnsQuery(ctx.queries.hostedRecordLocation, ctx);
        case NumLocation.populator:
          return this.populatorQuery(ctx);
        case NumLocation.none:
        default:
          return false;
      }
    };

    // Step through the state machine, querying DNS as we go.
    const sm = createLookupLocationStateMachine();
    while (!sm.complete()) {
      log.info(`Checking location: '${ctx.location}'`);
      const result = await query();
      ctx.location = sm.step(result);
    }

    if (ctx.result) {
      log.info(`Lookup result: '${ctx.result}', location: '${ctx.location}'`);
    } else {
      log.info(`Lookup result: 'null', location: '${ctx.location}'`);
    }

    return ctx.result;
  }

  /**
   * Interprets a MODL record for the given module
   *
   * @param modl
   * @returns json
   */
  // eslint-disable-next-line complexity
  public interpret(modl: string): string | null {
    // Interpret the MODL
    const jsonResult = this.modlServices.interpretNumRecord(modl);
    log.debug(`Interpreter raw JSON result: ${JSON.stringify(jsonResult)}`);

    return JSON.stringify(jsonResult);
  }

  /**
   * Independent or Hosted query
   *
   * @returns
   */
  private async dnsQuery(query: string, ctx: Context) {
    const result = await this.dnsServices.getRecordFromDns(query, ctx.dnssec);
    if (result.length > 0 && /(^\d+\|.*)|(\d+\/\d+\|@n=\d+;.*)|(@n=\d+;.*)/.test(result)) {
      ctx.result = result;
      return true;
    }
    return false;
  }

  /**
   * Populator query
   *
   * @returns
   */
  private async populatorQuery(ctx: Context) {
    const populatorLocation = ctx.queries.populatorLocation;

    if (populatorLocation) {
      const result = await this.dnsServices.getRecordFromDns(populatorLocation, false);

      // Return the status_ code or false for error_ otherwise true
      // Warning: potentially fragile since it relies on the format of the populator response.
      // TODO: Ideally we would parse the response MODL to JSON and inspect that instead.
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
        ctx.result = this.interpret(result);
        return true;
      }
    }
    return false;
  }
}
