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
import Ajv from 'ajv';
import chalk from 'chalk';
import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import { mapper } from 'object-unpacker';
import { Context, NumLocation, UserVariable } from './context';
import { DnsClient } from './dnsclient';
import { createDnsServices, DnsServices } from './dnsservices';
import { NumLookupRedirect, NumMaximumRedirectsExceededException } from './exceptions';
import { setenvDomainLookups } from './lookupgenerators';
import { createLookupLocationStateMachine } from './lookupstatemachine';
import { createModlServices, ModlServices } from './modlservices';
import { createModuleConfigProvider, ModuleConfig, ModuleConfigProvider } from './moduleconfig';
import { NumUri, PositiveInteger } from './numuri';
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

  /**
   *
   * @param modl a raw MODL string
   * @param moduleNumber a PositiveInteger module number
   * @param userVariables a Map of user-supplied values such as 'C' and 'L' for country and language respectively.
   */
  interpret(modl: string, moduleNumber: PositiveInteger, userVariables: Map<string, UserVariable>): Promise<string | null>;

  /**
   * Set the execution environment.
   * Calls setDnsEnv() and setModuleEnv() with the same environment name
   *
   * @param env `test` for the test environment
   */
  setenv(env: string): void;

  /**
   * Set the execution environment.
   * Sets the environment to use for DNS
   *
   * @param env `test` for the test environment
   */
  setDnsEnv(env: string): void;

  /**
   * Set the execution environment.
   * Sets the environment to use for the modules files.
   *
   * @param env `test` for the test environment
   */
  setModuleEnv(env: string): void;

  /**
   * Set a timeout for DoH requests.
   * Defaults to 500ms
   *
   * @param t the DoH request timeout in milliseconds
   */
  setTimeoutMillis(t: number): void;
}

/**
 * Used to report errors in the NUM protocol
 */
export enum NumProtocolErrorCode {
  errorCreatingContext = 'ERROR_CREATING_CONTEXT',
  compactSchemaError = 'COMPACT_SCHEMA_ERROR',
  localeFileNotFoundError = 'LOCALE_FILE_NOT_FOUND_ERROR',
  noUnpackerConfigFileFound = 'NO_UNPACKER_CONFIG_FILE_FOUND',
  expandedSchemaError = 'EXPANDED_SCHEMA_ERROR',
  moduleConfigFileNotFound = 'MODULE_CONFIG_FILE_NOT_FOUND',
  tooManyRedirects = 'TOO_MANY_REDIRECTS',
  internalError = 'INTERNAL_ERROR',
  noModlRecordFound = 'NO_MODL_RECORD_FOUND',
  schemaNotFound = 'SCHEMA_NOT_FOUND',
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

log.setLevel('info');

const DEFAULT_LOCALES_BASE_URL = new URL('https://modules.numprotocol.com/1/locales/');
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_COUNTRY = 'gb';
const DEFAULT_LOCALE_FILE_NAME = 'en-gb.json';
const DNS_REQUEST_TIMEOUT_MS = 500;

const ajv = new Ajv({ allowUnionTypes: true });

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
      return `${chalk.gray(timestamp.toString())} ${colouredLevel} ${chalk.green(name + ':')}`;
    } else {
      return `${chalk.gray(timestamp.toString())} ${colouredLevel}`;
    }
  },
});

prefix.apply(log.getLogger('critical'), {
  format: (level: string, name: string | undefined, timestamp: Date | string) =>
    name ? chalk.red.bold(`[${timestamp.toString()}] ${level} ${name}:`) : chalk.red.bold(`[${timestamp.toString()}] ${level}:`),
});

//------------------------------------------------------------------------------------------------------------------------

/**
 * Error reporting.
 */
class NumProtocolException extends Error {
  constructor(readonly errorCode: NumProtocolErrorCode, message: string) {
    super(message);
  }
}

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
  private configProvider: ModuleConfigProvider;
  private resourceLoader: ResourceLoader;

  /**
   * Creates an instance of num client impl.
   *
   * @param [dnsClient]
   */
  constructor(dnsClient?: DnsClient) {
    this.dnsServices = createDnsServices(DNS_REQUEST_TIMEOUT_MS, dnsClient);
    this.modlServices = createModlServices();
    this.resourceLoader = createResourceLoader();
    this.configProvider = createModuleConfigProvider(this.resourceLoader);
  }

  /**
   *
   * @param loader Override the default resource loader for testing.
   */
  setResourceLoader(loader: ResourceLoader): void {
    this.resourceLoader = loader;
    this.configProvider = createModuleConfigProvider(this.resourceLoader);
  }

  /**
   * Set the execution environment.
   *
   * @param env `test` for the test environment
   */
  setenv(env: string): void {
    this.setDnsEnv(env);
    this.setModuleEnv(env);
  }

  /**
   * Set the execution environment.
   *
   * @param env `test` for the test environment
   */
  setDnsEnv(env: string): void {
    setenvDomainLookups(env);
  }

  /**
   * Set whete the modules files should be loaded from.
   *
   * @param env `test` for the test environment
   */
  setModuleEnv(env: string): void {
    this.resourceLoader.setenv(env);
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
  async retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
    while (true) {
      try {
        const modl = await this.retrieveModlRecordInternal(ctx);
        if (modl) {
          const json = await this.interpret(modl, ctx.numAddress.port, ctx.userVariables);
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
        } else if (e instanceof Error) {
          log.warn(`Unhandled exception: ${e.message}`);
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
   * @param moduleNumber
   * @param userVariables
   * @returns interpret
   */
  // eslint-disable-next-line complexity
  public async interpret(modl: string, moduleNumber: PositiveInteger, userVariables: Map<string, UserVariable>): Promise<string | null> {
    if (moduleNumber.n !== 0) {
      // Process the resulting JSON according to the ModuleConfig.json
      const moduleConfig = await this.configProvider.getConfig(moduleNumber);
      if (moduleConfig) {
        // Skip everything if specified
        if (!moduleConfig.processingChain.modlToJson) {
          return modl;
        }

        // Interpret the MODL
        let jsonResult = this.modlServices.interpretNumRecord(modl);
        log.debug(`Interpreter raw JSON result: ${JSON.stringify(jsonResult)}`);

        // Validate the compact schema if there is one and if the config says we should
        if (moduleConfig.processingChain.validateCompactJson && moduleConfig.compactSchemaUrl) {
          // load the schema and use it to validate jsonResult
          if (!(await this.validateSchema(moduleConfig.compactSchemaUrl, jsonResult))) {
            throw new NumProtocolException(NumProtocolErrorCode.compactSchemaError, 'The record does not match the compact schema');
          }
        } else {
          log.info('Not configured to validate against the compact schema.');
        }

        // Attempt to load a locale file.
        const localeFile = await this.loadLocaleFile(moduleConfig, userVariables);
        if (!localeFile) {
          throw new NumProtocolException(NumProtocolErrorCode.localeFileNotFoundError, `Unable to locate a locale file using ${JSON.stringify(userVariables)}`);
        }

        // Apply the schema mapping and Resolve references if one is defined
        if (moduleConfig.schemaMapUrl && moduleConfig.processingChain.unpack) {
          const schemaMapResponse = await this.resourceLoader.load(moduleConfig.schemaMapUrl);

          if (schemaMapResponse) {
            jsonResult = mapper.convert(localeFile, jsonResult as any, schemaMapResponse) as Record<string, unknown>;
            log.debug(`Object Unpacker JSON result: ${JSON.stringify(jsonResult)}`);
          } else {
            // No schema map
            log.error(`Unable to load schema map defined in ${JSON.stringify(moduleConfig)}`);
            throw new NumProtocolException(
              NumProtocolErrorCode.noUnpackerConfigFileFound,
              `Could not load the configure Unpacker config file: ${moduleConfig.schemaMapUrl}`
            );
          }
        }

        // Validate the expanded schema if there is one and if the config says we should
        if (moduleConfig.processingChain.validateExpandedJson && moduleConfig.expandedSchemaUrl) {
          // load the schema and use it to validate the expanded JSON
          if (!(await this.validateSchema(moduleConfig.expandedSchemaUrl, jsonResult))) {
            throw new NumProtocolException(NumProtocolErrorCode.expandedSchemaError, 'The record does not match the expanded schema');
          }
        } else {
          log.info('Not configured to validate against the expanded schema.');
        }

        return JSON.stringify(jsonResult);
      } else {
        log.error('No module config file available.');
        throw new NumProtocolException(NumProtocolErrorCode.moduleConfigFileNotFound, `Unable to load the module config file for module ${moduleNumber.n} `);
      }
    } else {
      // Interpret the MODL
      const jsonResult = this.modlServices.interpretNumRecord(modl);
      const jsonString = JSON.stringify(jsonResult);
      log.debug(`Interpreter raw JSON result: ${jsonString}`);
      return jsonString;
    }
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
        ctx.result = await this.interpret(result, ctx.numAddress.port, ctx.userVariables);
        return true;
      }
    }
    return false;
  }

  private async validateSchema(schemaUrl: string, json: Record<string, unknown>): Promise<boolean> {
    let existingSchema = ajv.getSchema(schemaUrl);
    if (!existingSchema) {
      const schema = await this.resourceLoader.load(schemaUrl);

      // Validate the schema if there is one
      if (schema) {
        existingSchema = ajv.getSchema(schemaUrl) ? ajv.getSchema(schemaUrl) : ajv.compile(schema);
      } else {
        const msg = `Unable to load the JSON schema from : ${schemaUrl}`;
        log.error(msg);
        throw new NumProtocolException(NumProtocolErrorCode.schemaNotFound, msg);
      }
    }
    if (!existingSchema) {
      const msg = `Cannot find the JSON schema at ${schemaUrl}`;
      log.error(msg);
      throw new NumProtocolException(NumProtocolErrorCode.schemaNotFound, msg);
    }
    if (existingSchema(json)) {
      log.info(`JSON matches the schema at ${schemaUrl}`);
      return true;
    } else {
      log.error(`Fails to match the JSON schema at ${schemaUrl} - data: ${JSON.stringify(json)}`);
    }
    return false;
  }

  private async loadLocaleFile(moduleConfig: ModuleConfig, userVariables: Map<string, UserVariable>): Promise<Record<string, unknown> | null> {
    // Attempt to load a locale file.
    // Choose the locale base URL
    const baseUrl = moduleConfig.localeFilesBaseUrl ? moduleConfig.localeFilesBaseUrl : DEFAULT_LOCALES_BASE_URL;
    let country = userVariables.get('_C')?.toString();
    let language = userVariables.get('_L')?.toString();
    if (!language) {
      language = DEFAULT_LANGUAGE;
    }
    if (!country) {
      country = DEFAULT_COUNTRY;
    }
    const localeFilename = `${language}-${country}.json`;
    const localeUrl = baseUrl.toString() + localeFilename;

    log.debug(`Loading locale file: ${localeUrl}`);
    // Try loading the locale file and fallback to the default if we can't find one.
    let localeFileResponse = await this.resourceLoader.load(localeUrl);

    if (!localeFileResponse) {
      if (localeFilename === DEFAULT_LOCALE_FILE_NAME) {
        log.debug(`Unable to load locale file: ${localeUrl}`);
        return null;
      } else {
        const defaultLocaleUrl = baseUrl.toString() + DEFAULT_LOCALE_FILE_NAME;
        localeFileResponse = await this.resourceLoader.load(defaultLocaleUrl);
        if (!localeFileResponse) {
          log.debug(`Unable to load locale file: ${defaultLocaleUrl}`);
          return null;
        }
      }
    }
    return localeFileResponse;
  }
}
