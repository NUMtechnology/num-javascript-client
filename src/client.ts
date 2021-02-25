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
import chalk from 'chalk';
import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { mapper } from 'num-schema-mapper';
import { Context, NumLocation, UserVariable } from './context';
import { DnsClient } from './dnsclient';
import { createDnsServices, DnsServices } from './dnsservices';
import { NumLookupRedirect, NumMaximumRedirectsExceededException } from './exceptions';
import { createInternalKeysFilter, InternalKeysFilter } from './keysfilter';
import { createLookupLocationStateMachine } from './lookupstatemachine';
import { createModlServices, ModlServices } from './modlservices';
import { createModuleConfigProvider, ModuleConfigProvider } from './moduleconfig';
import { NumUri, PositiveInteger } from './numuri';
import { createReferencesResolver, ReferencesResolver } from './referencesresolver';
import { createResourceLoader, ResourceLoader } from './resourceloader';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Creates client
 *
 * @returns client
 */
export const createClient = (dnsClient?: DnsClient): NumClient => new NumClientImpl(dnsClient);

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
  retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;

  /**
   * Returns the raw MODL record, after redirection if appropriate
   *
   * @param ctx
   * @param handler
   * @returns MODL record
   */
  retrieveModlRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;

  /**
   *
   * @param loader Override the default ResourceLoader - mainly used for testing.
   */
  setResourceLoader(loader: ResourceLoader): void;
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

const DEFAULT_LOCALES_BASE_URL = new URL('https://modules.numprotocol.com/1/locales/');

//------------------------------------------------------------------------------------------------------------------------
// Set up logging
//------------------------------------------------------------------------------------------------------------------------

const colors = (lvl: string) => {
  switch (lvl) {
    case 'TRACE':
      return chalk.magenta;
    case 'DEBUG':
      return chalk.cyan;
    case 'INFO':
      return chalk.blue;
    case 'WARN':
      return chalk.yellow;
    case 'ERROR':
      return chalk.red;
    default:
      return chalk.red;
  }
};

prefix.reg(log);

prefix.apply(log, {
  format: (level: string, name: string | undefined, timestamp: Date | string) => {
    const levelName = level.toUpperCase();
    const levelColour = colors(levelName);
    const colouredLevel: string = levelColour(levelName);
    if (name) {
      return `${chalk.gray(`[${timestamp.toString()}]`)} ${colouredLevel} ${chalk.green(`${name}:`)}`;
    } else {
      return `${chalk.gray(`[${timestamp.toString()}]`)} ${colouredLevel}`;
    }
  },
});

prefix.apply(log.getLogger('critical'), {
  format: (level: string, name: string | undefined, timestamp: Date | string) =>
    name ? chalk.red.bold(`[${timestamp.toString()}] ${level} ${name}:`) : chalk.red.bold(`[${timestamp.toString()}] ${level}:`),
});

//------------------------------------------------------------------------------------------------------------------------

/**
 * Default callback handler - a minimal class for responding to Callbacks from the NumClient
 */
class DefaultCallbackHandler implements CallbackHandler {
  private location: NumLocation | null = null;
  private result: string | null = null;

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
}

/**
 * Num client impl
 */
class NumClientImpl implements NumClient {
  readonly dnsServices: DnsServices;
  readonly modlServices: ModlServices;
  private readonly configProvider: ModuleConfigProvider;
  private resourceLoader: ResourceLoader;
  private internalKeysFilter: InternalKeysFilter;
  private referencesResolver: ReferencesResolver;

  /**
   * Creates an instance of num client impl.
   *
   * @param [dnsClient]
   */
  constructor(dnsClient?: DnsClient) {
    this.dnsServices = createDnsServices(dnsClient);
    this.modlServices = createModlServices();
    this.configProvider = createModuleConfigProvider();
    this.resourceLoader = createResourceLoader();
    this.internalKeysFilter = createInternalKeysFilter();
    this.referencesResolver = createReferencesResolver();
  }

  /**
   *
   * @param loader Override the default resource loader for testing.
   */
  setResourceLoader(loader: ResourceLoader): void {
    this.resourceLoader = loader;
  }
  /**
   * Creates an instance of num client impl.
   *
   * @param numAddress
   */
  createContext(numAddress: NumUri): Context {
    return new Context(numAddress);
  }

  /**
   * Retrieves num record and interprets it to JSON
   *
   * @param ctx
   * @param handler
   * @returns num record
   */
  async retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx);
        if (modl) {
          const json = await this.interpret(modl, ctx.numAddress.port, ctx.userVariables);
          if (json) {
            if (handler) {
              handler.setResult(json);
            }
          }
          return json;
        }
        return null;
      } catch (e) {
        if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = NumLocation.none;
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = NumLocation.independent;
          ctx.handleQueryRedirect(e.message);
        } else if (e instanceof Error) {
          log.warn(`Unhandled exception: ${e.message}`);
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
  async retrieveModlRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx);
        if (modl) {
          // We need to interpret the record to check for redirects, but we ignore the result.
          await this.interpret(modl, ctx.numAddress.port, ctx.userVariables);
          if (handler) {
            handler.setResult(modl);
          }
          return modl;
        }
        return null;
      } catch (e) {
        if (e instanceof NumMaximumRedirectsExceededException) {
          log.warn('Too many redirects. Aborting the lookup.');
          ctx.result = null;
          ctx.location = NumLocation.none;
          return null;
        } else if (e instanceof NumLookupRedirect) {
          ctx.location = NumLocation.independent;
          ctx.handleQueryRedirect(e.message);
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
          return await this.dnsQuery(ctx.queries.independentRecordLocation, ctx);
        case NumLocation.hosted:
          return await this.dnsQuery(ctx.queries.hostedRecordLocation, ctx);
        case NumLocation.populator:
          return await this.populatorQuery(ctx);
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
      ctx.location = await sm.step(result);
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
   * @param port
   * @param userVariables
   * @returns interpret
   */
  private async interpret(modl: string, port: PositiveInteger, userVariables: Map<string, UserVariable>): Promise<string | null> {
    let uv = '';
    userVariables.forEach((v, k) => {
      uv += `${k}=${v.toString()};`;
    });

    let jsonResult = this.modlServices.interpretNumRecord(`${uv}${modl}`);
    const moduleConfig = this.configProvider.getConfig(port);
    if (moduleConfig) {
      // Validate the compact schema if there is one and if the config says we should
      if (moduleConfig.processingChain.validateCompactJson && moduleConfig.compactSchemaUrl) {
        // TODO: load the schema and use it to validate jsonResult
      }

      // Apply the schema mapping if one is defined
      if (moduleConfig.schemaMapUrl && moduleConfig.processingChain.unpack) {
        const schemaMapResponse = await this.resourceLoader.load(moduleConfig.schemaMapUrl);

        if (schemaMapResponse) {
          const schemaMap = schemaMapResponse.data as Record<string, unknown>;
          jsonResult = mapper.convert(jsonResult as any, schemaMap) as Record<string, unknown>;
        } else {
          // No schema map
          log.error(`Unable to load schema map defined in ${JSON.stringify(moduleConfig)}`);
          return null;
        }
      }

      // Attempt to load a locale file.
      // Choose the locale base URL
      const baseUrl = moduleConfig.localeFilesBaseUrl ? moduleConfig.localeFilesBaseUrl : DEFAULT_LOCALES_BASE_URL;
      let country = userVariables.get('_C')?.toString();
      let language = userVariables.get('_L')?.toString();
      if (!language) {
        language = 'en';
      }
      if (!country) {
        country = 'gb';
      }
      const localeFilename = `${language}-${country}.txt`;
      const localeUrl = new URL(baseUrl.toString() + localeFilename);

      // Try loading the locale file and fallback to the default if we can't find one.
      let localeFileResponse = await this.resourceLoader.load(localeUrl);

      if (!localeFileResponse) {
        const defaultLocaleUrl = new URL(baseUrl.toString() + 'en-gb.txt');
        localeFileResponse = await this.resourceLoader.load(defaultLocaleUrl);
        if (!localeFileResponse) {
          log.error(`Cannot load locale file from ${localeUrl.toString()} or ${defaultLocaleUrl.toString()}`);
          return null;
        }
      }

      // Resolve references
      if (moduleConfig.processingChain.resolveReferences) {
        const localeFile = localeFileResponse.data as Record<string, unknown>;
        jsonResult = this.referencesResolver.resolve(localeFile, jsonResult);
      }

      // Filter our internal keys
      if (moduleConfig.processingChain.removeInternalValues) {
        jsonResult = this.internalKeysFilter.filter(jsonResult);
      }

      // Validate the expanded schema if there is one and if the config says we should
      if (moduleConfig.processingChain.validateExpandedJson && moduleConfig.expandedSchemaUrl) {
        // TODO: load the schema and use it to validate jsonResult
      }

      return JSON.stringify(jsonResult);
    } else {
      log.error('No module config file available.');
      return null;
    }
  }

  /**
   * Independent or Hosted query
   *
   * @returns
   */
  private async dnsQuery(query: string, ctx: Context) {
    const result = await this.dnsServices.getRecordFromDns(query, ctx.dnssec);
    if (result.length > 0) {
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
        ctx.result = await this.interpret(result, ctx.numAddress.port, ctx.userVariables);
        return true;
      }
    }
    return false;
  }
}
