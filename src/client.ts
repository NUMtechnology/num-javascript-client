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
import addFormats from 'ajv-formats';
import { mapper } from 'object-unpacker';
import { Context, NumLocation, UserVariable } from './context';
import { DoHResolver } from './dnsclient';
import { createDnsServices, DnsServices } from './dnsservices';
import {
  NumLookupBadDoHResponse,
  NumLookupEmptyResult,
  NumLookupRedirect,
  NumMaximumRedirectsExceededException,
  NumNotImplementedException,
  NumProtocolErrorCode,
  NumProtocolException,
} from './exceptions';
import { setenvDomainLookups } from './lookupgenerators';
import { createLookupLocationStateMachine } from './lookupstatemachine';
import { createModlServices, ModlServices } from './modlservices';
import { createModuleConfigProvider, ModuleConfig, ModuleConfigProvider, SubstitutionsType } from './moduleconfig';
import { NumUri, parseNumUri, PositiveInteger } from './numuri';
import { createResourceLoader, ResourceLoader } from './resourceloader';
import { AxiosResponse } from 'axios';
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

  return client.retrieveNumRecord(ctx);
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
   * @param targetExpandedVersion the version number of the required expanded schema, as a string value.
   */
  interpret(modl: string, moduleNumber: PositiveInteger, userVariables: Map<string, UserVariable>, targetExpandedVersion: string): Promise<string | null>;

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

  /**
   * Required by chrome browser extensions.
   */
  disableSchemaValidation(): void;
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

const DEFAULT_BASE_URL = 'https://modules.numprotocol.com/';
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_COUNTRY = 'us';
const DEFAULT_LOCALE_FILE_NAME = 'en-us.json';
const DNS_REQUEST_TIMEOUT_MS = 500;

const expandedSchemaPathComponent = 'expanded';
const compactSchemaPathComponent = 'compact';

const ajv = new Ajv({ strict: false });
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
addFormats(ajv);

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
  private configProvider: ModuleConfigProvider;
  private resourceLoader: ResourceLoader;
  private schemaValidationIsDisabled: boolean;

  /**
   * Creates an instance of num client impl.
   *
   * @param [dnsClient]
   */
  constructor(resolvers?: Array<DoHResolver>) {
    this.schemaValidationIsDisabled = false;
    this.dnsServices =
      resolvers && resolvers.length > 0 ? createDnsServices(DNS_REQUEST_TIMEOUT_MS, resolvers) : createDnsServices(DNS_REQUEST_TIMEOUT_MS, DEFAULT_RESOLVERS);

    this.modlServices = createModlServices();
    this.resourceLoader = createResourceLoader();
    this.configProvider = createModuleConfigProvider(this.resourceLoader);
  }

  /**
   * Required by chrome browser extensions.
   */
  disableSchemaValidation(): void {
    this.schemaValidationIsDisabled = true;
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
          const json = await this.interpret(modl, ctx.numAddress.port, ctx.userVariables, ctx.targetExpandedSchemaVersion);
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
  async retrieveModlRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null> {
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
   * @param moduleNumber
   * @param userVariables
   * @returns interpret
   */
  // eslint-disable-next-line complexity
  public async interpret(
    modl: string,
    moduleNumber: PositiveInteger,
    userVariables: Map<string, UserVariable>,
    targetExpandedVersion: string
  ): Promise<string | null> {
    // Interpret the MODL
    let jsonResult = this.modlServices.interpretNumRecord(modl);
    log.debug(`Interpreter raw JSON result: ${JSON.stringify(jsonResult)}`);

    if (moduleNumber.n !== 0) {
      // Process the resulting JSON according to the config.json file
      const moduleConfig = await this.configProvider.getConfig(moduleNumber);
      if (moduleConfig) {
        const compactVersion: string = jsonResult['@v'] ? `${jsonResult['@v'] as number}` : '1';

        // Validate the compact schema if there is one and if the config says we should
        if (moduleConfig.compactSchema && !this.schemaValidationIsDisabled) {
          // load the schema and use it to validate jsonResult
          if (!(await this.validateSchema(moduleNumber.n, compactSchemaPathComponent, compactVersion, jsonResult))) {
            throw new NumProtocolException(NumProtocolErrorCode.compactSchemaError, 'The record does not match the compact schema');
          }
        } else {
          log.info('Not configured to validate against the compact schema.');
        }

        let substitutionsData: Record<string, unknown> | null = {};
        // Apply the schema mapping and Resolve references if one is defined
        if (moduleConfig.substitutions) {
          // Attempt to load a substitutions file.
          substitutionsData = await this.loadSubstitutionsFile(moduleConfig, userVariables);
          if (!substitutionsData) {
            throw new NumProtocolException(
              NumProtocolErrorCode.substitutionsFileNotFoundError,
              `Unable to locate a substitutions file using ${JSON.stringify(userVariables)}`
            );
          }
        }

        const schemaMapUrl = await this.generateSchemaMapUrl(moduleConfig, compactVersion, targetExpandedVersion);
        const schemaMapResponse = await this.resourceLoader.load(schemaMapUrl);

        if (schemaMapResponse && schemaMapResponse.data) {
          jsonResult = mapper.convert(substitutionsData, jsonResult as any, schemaMapResponse.data) as Record<string, unknown>;
          log.debug(`Object Unpacker JSON result: ${JSON.stringify(jsonResult)}`);
        } else {
          // No schema map
          log.error(`Unable to load schema map defined in ${JSON.stringify(moduleConfig)}`);
          throw new NumProtocolException(NumProtocolErrorCode.noUnpackerConfigFileFound, `Could not load the configured Unpacker config file: ${schemaMapUrl}`);
        }

        // Validate the expanded schema if there is one and if the config says we should
        if (moduleConfig.expandedSchema && !this.schemaValidationIsDisabled) {
          if (!jsonResult['@version']) {
            throw new NumProtocolException(NumProtocolErrorCode.missingExpandedSchemaVersion, JSON.stringify(jsonResult));
          }
          const expandedVersion = `${jsonResult['@version'] as number}`;
          // load the schema and use it to validate the expanded JSON
          if (!(await this.validateSchema(moduleNumber.n, expandedSchemaPathComponent, expandedVersion, jsonResult))) {
            throw new NumProtocolException(NumProtocolErrorCode.expandedSchemaError, 'The record does not match the expanded schema');
          }
        } else {
          log.info('Not configured to validate against the expanded schema.');
        }
      } else {
        log.error('No module config file available.');
        throw new NumProtocolException(NumProtocolErrorCode.moduleConfigFileNotFound, `Unable to load the module config file for module ${moduleNumber.n} `);
      }
    }
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
        ctx.result = await this.interpret(result, ctx.numAddress.port, ctx.userVariables, ctx.targetExpandedSchemaVersion);
        return true;
      }
    }
    return false;
  }

  private async validateSchema(moduleNumber: number, schemaType: string, version: string, json: Record<string, unknown>): Promise<boolean> {
    const schemaUrl = `${DEFAULT_BASE_URL}${moduleNumber}/${schemaType}/v${version}/schema.json`;
    let existingSchema = ajv.getSchema(schemaUrl);
    if (!existingSchema) {
      const schema = await this.resourceLoader.load(schemaUrl);

      // Validate the schema if there is one
      if (schema && schema.data) {
        existingSchema = ajv.getSchema(schemaUrl) ? ajv.getSchema(schemaUrl) : ajv.compile(schema.data);
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

  private async loadSubstitutionsFile(moduleConfig: ModuleConfig, userVariables: Map<string, UserVariable>): Promise<Record<string, unknown> | null> {
    // Attempt to load a substitutions file.
    let subsFileName = '';
    let subsFileResponse: AxiosResponse<any> | null = null;

    if (moduleConfig.substitutionsType === SubstitutionsType.locale) {
      let country = userVariables.get('_C')?.toString();
      let language = userVariables.get('_L')?.toString();
      if (!language) {
        language = DEFAULT_LANGUAGE;
      }
      if (!country) {
        country = DEFAULT_COUNTRY;
      }
      const localeFilename = `${language}-${country}.json`;
      subsFileName = `${DEFAULT_BASE_URL}${moduleConfig.moduleId.n}/locales/${localeFilename}`;

      // Try loading the substitutions file and fallback to the default if we can't find one.
      subsFileResponse = await this.resourceLoader.load(subsFileName);

      if (!subsFileResponse || !subsFileResponse.data) {
        if (localeFilename === DEFAULT_LOCALE_FILE_NAME) {
          log.debug(`Unable to load substitutions file: ${subsFileName}`);
          return null;
        } else {
          const fallbackLocale = await this.generateFallbackLocaleFileName(moduleConfig, language);
          subsFileResponse = await this.resourceLoader.load(fallbackLocale);
          if (!subsFileResponse || !subsFileResponse.data) {
            log.debug(`Unable to load substitutions file: ${fallbackLocale}`);
            return null;
          }
        }
      }
    } else if (moduleConfig.substitutionsType === SubstitutionsType.standard) {
      subsFileName = `${DEFAULT_BASE_URL}${moduleConfig.moduleId.n}/substitutions.json`;

      subsFileResponse = await this.resourceLoader.load(subsFileName);

      if (!subsFileResponse || !subsFileResponse.data) {
        log.debug(`Unable to load substitutions file: ${subsFileName}`);
        return null;
      }
    } else {
      throw new NumNotImplementedException(`Unknown substitutionsType value: ${JSON.stringify(moduleConfig.substitutionsType)}`);
    }
    return subsFileResponse.data as Record<string, unknown>;
  }

  private async generateSchemaMapUrl(moduleConfig: ModuleConfig, compactVersion: string, targetExpandedVersion: string): Promise<string> {
    const mapJsonUrl = `${DEFAULT_BASE_URL}${moduleConfig.moduleId.n}/transformation/map.json`;
    const mapJson = await this.resourceLoader.load(mapJsonUrl);
    if (!mapJson || !mapJson.data) {
      throw new NumProtocolException(NumProtocolErrorCode.missingTransformationsMap, `No map.json available at ${mapJsonUrl}`);
    }

    return mapJsonToTransformationFileName(moduleConfig.moduleId.n, mapJson.data as Record<string, unknown>, compactVersion, targetExpandedVersion);
  }

  private async generateFallbackLocaleFileName(moduleConfig: ModuleConfig, lang: string): Promise<string> {
    const listJsonUrl = `${DEFAULT_BASE_URL}${moduleConfig.moduleId.n}/locales/list.json`;
    const listJson = await this.resourceLoader.load(listJsonUrl);

    if (listJson && listJson.data) {
      return findFirstWithSameLanguage(listJson.data as Array<string>, lang, moduleConfig);
    } else {
      throw new NumProtocolException(
        NumProtocolErrorCode.missingLocalesList,
        `No list.json file found for module ${moduleConfig.moduleId.n} at ${listJsonUrl}`
      );
    }
  }
}

export const mapJsonToTransformationFileName = (
  module: number,
  mapJson: Record<string, unknown>,
  compactVersion: string,
  targetExpandedVersion: string
): string => {
  const c = mapJson[`compact-v${compactVersion}`] as Record<string, Record<string, string>>;
  const e = c[`expanded-v${targetExpandedVersion}`];
  if (e) {
    const transformationFileName: string = e['transformation-file'];
    if (transformationFileName) {
      return `${DEFAULT_BASE_URL}${module}/transformation/${transformationFileName}`;
    } else {
      throw new NumProtocolException(
        NumProtocolErrorCode.invalidTargetExpandedSchemaForModule,
        `Module: ${module} has no target expanded schema v${targetExpandedVersion} configured for compact schema version v${compactVersion}`
      );
    }
  } else {
    throw new NumProtocolException(
      NumProtocolErrorCode.invalidTargetExpandedSchemaForModule,
      `Module: ${module} has no target expanded schema v${targetExpandedVersion} configured for compact schema version v${compactVersion}`
    );
  }
};

export const findFirstWithSameLanguage = (listJson: string[], lang: string, moduleConfig: ModuleConfig): string => {
  let found = listJson.find((v) => v.startsWith(lang));
  if (!found) {
    found = 'en-us';
  }
  return `${DEFAULT_BASE_URL}${moduleConfig.moduleId.n}/locales/${found}.json`;
};
