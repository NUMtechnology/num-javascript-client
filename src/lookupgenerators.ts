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
import punycode from 'punycode';
import { URL } from 'url';
import { NumBadUrlException, NumException, NumInvalidParameterException } from './exceptions';
import { hashByDepth } from './hashutils';
import { Hostname, MODULE_0, NO_USER_INFO, NumUri, PositiveInteger, UrlUserInfo } from './numuri';
import pino from 'pino';

const _NUM = '._num.';
const DNPREFIX = '_';
let TLZ = 'num.net';
const EMAIL_SEP = 'e';
const POP_3LZ = 'populator';
const DEFAULT_DEPTH = 3;
const WWW_REGEX = new RegExp(/^www\.\w+\.\w+/);
const SCHEME_REGEX = new RegExp(/^[a-zA-Z][0-9a-zA-Z+.-]+:/);
const log = pino();
//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
export const setenvDomainLookups = (env: string): void => {
  switch (env) {
    case 'test':
      TLZ = 'n001.uk';
      break;
    case 'staging':
      TLZ = 'n002.uk';
      break;
    case 'prod':
      TLZ = 'num.net';
      break;
    default:
      TLZ = 'num.net';
  }
};

/**
 * Lookup generator
 */
export interface LookupGenerator {
  getRootIndependentLocationNoModuleNumber(arg0: boolean): string;
  getRootHostedLocationNoModuleNumber(arg0: boolean): string;
  getIndependentLocation(moduleId: PositiveInteger): string;
  getHostedLocation(moduleId: PositiveInteger): string;
  isDomainRoot(): boolean;
  getPopulatorLocation(moduleId: PositiveInteger): string | null;
  getRootIndependentLocation(moduleId: PositiveInteger): string;
  getRootHostedLocation(moduleId: PositiveInteger): string;
}

/**
 * Email lookup generator
 */
export interface EmailLookupGenerator extends LookupGenerator {
  getDistributedHostedLocation(moduleId: PositiveInteger, levels: PositiveInteger): string;
  getDistributedIndependentLocation(moduleId: PositiveInteger, levels: PositiveInteger): string;
}

/**
 * Creates domain lookup generator
 *
 * @param numId
 * @returns domain lookup generator
 */
export const createDomainLookupGenerator = (numUri: NumUri): LookupGenerator => new DomainLookupGenerator(numUri);

/**
 * Creates email lookup generator
 *
 * @param numId
 * @returns email lookup generator
 */
export const createEmailLookupGenerator = (numUri: NumUri): EmailLookupGenerator => new EmailLookupGeneratorImpl(numUri);

/**
 * Creates url lookup generator
 *
 * @param numId
 * @returns url lookup generator
 */
export const createUrlLookupGenerator = (numUri: NumUri): LookupGenerator => new UrlLookupGenerator(numUri);

/**
 * Creates a TNUM lookup generator
 *
 * @param numId
 * @returns TNUM lookup generator
 */
export const createTNUMLookupGenerator = (numUri: NumUri): LookupGenerator => new TNUMLookupGenerator(numUri);

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------
/**
 * Base lookup generator
 */
class BaseLookupGenerator implements LookupGenerator {
  protected _numUri: NumUri;
  protected _branch: string;

  /**
   * Creates an instance of base lookup generator.
   *
   * @param numId
   */
  constructor(numUri: NumUri) {
    this._numUri = numUri;
    this._branch = '';
  }

  /**
   * Gets independent location
   *
   * @param moduleId
   * @returns
   */
  getIndependentLocation(moduleId: PositiveInteger) {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   *
   * @param moduleId
   * @returns
   */
  getHostedLocation(moduleId: PositiveInteger) {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Determines whether domain root is
   *
   * @returns
   */
  isDomainRoot() {
    return this._branch === '';
  }

  /**
   * Gets populator location
   *
   * @param moduleId
   * @returns
   */
  getPopulatorLocation(moduleId: PositiveInteger) {
    return this.isDomainRoot() ? `${moduleId.n}.${DNPREFIX}${this._numUri.host.s}.${POP_3LZ}.${TLZ}.` : null;
  }

  /**
   * Gets root independent location
   *
   * @param moduleId
   * @returns
   */
  getRootIndependentLocation(moduleId: PositiveInteger) {
    return `${moduleId.n}${_NUM}${this._numUri.host.s}.`;
  }

  /**
   * Gets root independent location no module number
   *
   * @param addTrailingDot
   * @returns
   */
  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `_num.${this._numUri.host.s}.`;
    } else {
      return `_num.${this._numUri.host.s}`;
    }
  }

  /**
   * Gets root hosted location
   *
   * @param moduleId
   * @returns
   */
  getRootHostedLocation(moduleId: PositiveInteger) {
    return `${moduleId.n}.${DNPREFIX}${this._numUri.host.s}${hashByDepth(this._numUri.host.s, DEFAULT_DEPTH)}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   *
   * @param addTrailingDot
   * @returns
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._numUri.host.s}${hashByDepth(this._numUri.host.s, DEFAULT_DEPTH)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._numUri.host.s}${hashByDepth(this._numUri.host.s, DEFAULT_DEPTH)}.${TLZ}`;
    }
  }

  /**
   * Validates base lookup generator
   *
   * @param numId
   * @param moduleId
   */
  validate(numId: string, moduleId: number) {
    throw new Error(`Not implemented: valdate(${numId}, ${moduleId})`);
  }
}

/**
 * Transforms branch
 *
 * @param s
 * @returns branch
 */
export const transformBranch = (s: string): string => {
  if (s === '/') {
    return '';
  }

  const i = s.indexOf('/');
  return s
    .substring(i + 1)
    .split('/')
    .reverse()
    .join('.');
};

/**
 * Normalises domain name
 *
 * @param domainName
 * @returns domain name
 */
export const normaliseDomainName = (domainName: string): string => {
  if (!domainName) {
    throw new NumInvalidParameterException('Null domain name cannot be normalised');
  }

  if (domainName.trim() === '') {
    throw new NumInvalidParameterException('Empty domain name cannot be normalised');
  }

  if (SCHEME_REGEX.test(domainName)) {
    try {
      const host = new URL(domainName).hostname;
      return normaliseDomainName(host);
    } catch (e) {
      if (e instanceof NumException) {
        throw e;
      } else {
        throw new NumBadUrlException(`Invalid URL: ${domainName}`, e as Error);
      }
    }
  }

  let result = domainName;
  if (WWW_REGEX.test(result)) {
    result = result.substring(4);
  }

  if (result.startsWith('.')) {
    result = result.substring(1);
  }

  if (result.endsWith('.')) {
    result = result.substring(0, result.length - 1);
  }

  result = punycode.toASCII(result);

  return result;
};

/**
 * Normalises path
 *
 * @param path
 * @returns path
 */
export const normalisePath = (path: string): string => {
  let result = '/';
  if (path.length > 0) {
    const pathComponents = path.split('/');
    const nonEmptyPathComponents = pathComponents.filter((s) => s && s.length > 0);

    if (nonEmptyPathComponents.length > 0 && nonEmptyPathComponents[nonEmptyPathComponents.length - 1].includes('.')) {
      // Ignore the first item (i.e. last item before it was reversed) if it contains a '.' character
      nonEmptyPathComponents.pop();
    }

    if (nonEmptyPathComponents.length > 0) {
      result += nonEmptyPathComponents.join('/').split(' ').join('_');
    }
  }

  return result;
};

/**
 * Domain lookup generator
 */
class DomainLookupGenerator extends BaseLookupGenerator implements LookupGenerator {
  constructor(numUri: NumUri) {
    super(numUri);

    const branch = transformBranch(normalisePath(numUri.path.s));
    this._branch = branch !== '' ? punycode.toASCII(branch) : branch;

    if (this._branch !== branch) {
      log.debug(`Query ${this._branch} punycode ${branch}`);
    }

    this._numUri = this._numUri.withHost(new Hostname(normaliseDomainName(numUri.host.s)));
  }
}

/**
 * Email lookup generator
 */
class EmailLookupGeneratorImpl extends BaseLookupGenerator implements EmailLookupGenerator {
  constructor(numUri: NumUri) {
    super(numUri);

    const localPart = this._numUri.userinfo;
    const newUserinfo = localPart !== NO_USER_INFO ? punycode.toASCII(localPart.s) : localPart.s;

    this._numUri = this._numUri.withUserinfo(new UrlUserInfo(newUserinfo));
    this._numUri = this._numUri.withHost(new Hostname(normaliseDomainName(numUri.host.s)));

    const branch = transformBranch(normalisePath(numUri.path.s));

    this._branch = branch !== '' ? punycode.toASCII(branch) : branch;

    if (branch !== this._branch) {
      log.debug(`Query ${branch} punycode ${this._branch}`);
    }
  }

  /**
   * Gets local part
   */
  get localPart() {
    return this._numUri.userinfo.s;
  }

  /**
   * Gets independent location
   *
   * @param moduleId
   * @returns independent location
   */
  getIndependentLocation(moduleId: PositiveInteger): string {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   *
   * @param moduleId
   * @returns hosted location
   */
  getHostedLocation(moduleId: PositiveInteger): string {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets populator location
   *
   * @param moduleId
   * @returns populator location
   */
  getPopulatorLocation(moduleId: PositiveInteger): string | null {
    log.warn(`getPopulatorLocation called on email with ${moduleId.n}`);
    return null;
  }

  /**
   * Gets root independent location
   *
   * @param moduleId
   * @returns root independent location
   */
  getRootIndependentLocation(moduleId: PositiveInteger): string {
    return `${moduleId.n}.${DNPREFIX}${this.localPart}.${EMAIL_SEP}${_NUM}${this._numUri.host.s}.`;
  }

  /**
   * Gets root independent location no module number
   *
   * @param addTrailingDot
   * @returns root independent location no module number
   */
  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}${_NUM}${this._numUri.host.s}.`;
    } else {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}${_NUM}${this._numUri.host.s}`;
    }
  }

  /**
   * Gets root hosted location
   *
   * @param moduleId
   * @returns root hosted location
   */
  getRootHostedLocation(moduleId: PositiveInteger): string {
    return `${moduleId.n}.${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hashByDepth(
      this._numUri.host.s,
      DEFAULT_DEPTH
    )}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   *
   * @param addTrailingDot
   * @returns root hosted location no module number
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hashByDepth(this._numUri.host.s, DEFAULT_DEPTH)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hashByDepth(this._numUri.host.s, DEFAULT_DEPTH)}.${TLZ}`;
    }
  }

  /**
   * Gets distributed independent location
   *
   * @param moduleId
   * @param levels
   * @returns distributed independent location
   */
  getDistributedIndependentLocation(moduleId: PositiveInteger, levels: PositiveInteger): string {
    const emailLocalPartHash = hashByDepth(this._numUri.userinfo.s, levels.n);
    const result = `${moduleId.n}.${DNPREFIX}${this.localPart}${emailLocalPartHash}.${EMAIL_SEP}${_NUM}${this._numUri.host.s}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets distributed hosted location
   *
   * @param moduleId
   * @param levels
   * @returns distributed hosted location
   */
  getDistributedHostedLocation(moduleId: PositiveInteger, levels: PositiveInteger): string {
    const emailLocalPartHash = hashByDepth(this._numUri.userinfo.s, levels.n);
    const result = `${moduleId.n}.${DNPREFIX}${this.localPart}${emailLocalPartHash}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hashByDepth(
      this._numUri.host.s,
      DEFAULT_DEPTH
    )}.${TLZ}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }
}

/**
 * Url lookup generator
 */
class UrlLookupGenerator extends BaseLookupGenerator implements LookupGenerator {
  constructor(numUri: NumUri) {
    super(numUri);
    this._numUri = this._numUri.withHost(new Hostname(normaliseDomainName(numUri.host.s)));

    const branch = transformBranch(normalisePath(numUri.path.s));
    this._branch = branch !== '' ? punycode.toASCII(branch) : branch;

    if (branch !== this._branch) {
      log.debug(`Query ${branch} punycode ${this._branch}`);
    }
  }
}

const NO_COUNTRY_CODE_MSG = 'No Country code defined for ';
/**
 * TNUM lookup generator
 */
class TNUMLookupGenerator extends BaseLookupGenerator implements LookupGenerator {
  constructor(numUri: NumUri) {
    super(numUri);

    const branch = transformBranch(normalisePath(numUri.path.s));
    this._branch = branch !== '' ? punycode.toASCII(branch) : branch;

    if (this._branch !== branch) {
      log.debug(`Query ${this._branch} punycode ${branch}`);
    }

    this._numUri = this._numUri.withHost(new Hostname(normaliseDomainName(numUri.host.s)));
    if (!Hostname.isValidTNUM(this._numUri.host.s)) {
      throw new NumInvalidParameterException('Domain name is invalid for TNUM');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPopulatorLocation(_moduleNumber: PositiveInteger): string | null {
    return null;
  }

  getIndependentLocation(moduleNumber: PositiveInteger): string {
    const result: string = this.getRootIndependentLocation(moduleNumber);
    if (this._branch.length > 0) {
      return this._branch + '.' + result;
    }
    return result;
  }

  getHostedLocation(moduleNumber: PositiveInteger): string {
    const result: string = this.getRootHostedLocation(moduleNumber);
    if (this._branch.length > 0) {
      return this._branch + '.' + result;
    }
    return result;
  }

  getRootIndependentLocation(moduleNumber: PositiveInteger): string {
    const countryCode: CountryCode | undefined = this.findCountryCode(this._numUri.host.s);
    if (!countryCode) {
      throw new NumInvalidParameterException(NO_COUNTRY_CODE_MSG + this._numUri.host.s);
    }
    return `${moduleNumber.n}${_NUM}${this.formatIndependentTNumDomain(countryCode, this._numUri.host.s)}.${countryCode.dnsRoot}.`;
  }

  getRootHostedLocation(moduleNumber: PositiveInteger): string {
    const countryCode: CountryCode | undefined = this.findCountryCode(this._numUri.host.s);
    if (!countryCode) {
      throw new NumInvalidParameterException(NO_COUNTRY_CODE_MSG + this._numUri.host.s);
    }

    if (MappingPattern.sds === countryCode.mappingPattern) {
      return `${moduleNumber.n}.${DNPREFIX}${this.formatHostedTNumDomain(countryCode, this._numUri.host.s)}.${countryCode.dnsRoot}.`;
    } else {
      return `${moduleNumber.n}.${DNPREFIX}${this.formatHostedTNumDomain(countryCode, this._numUri.host.s)}._t.${TLZ}.`;
    }
  }

  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean): string {
    const countryCode: CountryCode | undefined = this.findCountryCode(this._numUri.host.s);
    if (!countryCode) {
      throw new NumInvalidParameterException(NO_COUNTRY_CODE_MSG + this._numUri.host.s);
    }

    const result = `_num.${this.formatIndependentTNumDomain(countryCode, this._numUri.host.s)}.${countryCode.dnsRoot}`;

    if (addTrailingDot) {
      return result + '.';
    }
    return result;
  }

  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean): string {
    const result = this.getRootHostedLocation(MODULE_0).substr(2);
    if (addTrailingDot) {
      return result;
    }
    return result.substr(0, result.length - 1);
  }

  formatIndependentTNumDomain(code: CountryCode, domain: string): string {
    const noIntlPrefix = domain.substr(code.code.length);
    let result = '';
    switch (code.mappingPattern) {
      case MappingPattern.bds:
        result = this.mapBDS(noIntlPrefix);
        result = reverse(result);
        break;
      case MappingPattern.sds:
        result = this.mapSDS(noIntlPrefix);
        break;
      default:
        throw new NumInvalidParameterException(`Bad enum value: ${code.mappingPattern as string}`);
    }
    return result;
  }

  formatHostedTNumDomain(code: CountryCode, domain: string): string {
    const noIntlPrefix = domain.substr(code.code.length);
    let result = '';
    switch (code.mappingPattern) {
      case MappingPattern.bds:
        result = this.mapBDS(noIntlPrefix);
        result = reverse(result) + '.' + reverse(code.code.substr(1));
        break;
      case MappingPattern.sds:
        result = this.mapSDS(noIntlPrefix);
        break;
      default:
        throw new NumInvalidParameterException(`Bad enum value: ${code.mappingPattern as string}`);
    }
    return result;
  }

  mapBDS(noIntlPrefix: string): string {
    let result = '';
    let count = 0;
    let threes = 1;
    let insertions = 0;
    while (count < noIntlPrefix.length) {
      result += noIntlPrefix.charAt(count);
      if (threes % 3 === 0 && insertions < 2) {
        result += '.';
        insertions++;
      }
      count++;
      threes++;
    }
    return result;
  }

  mapSDS(noIntlPrefix: string): string {
    return this.intersperseDots(reverse(noIntlPrefix));
  }

  intersperseDots(s: string): string {
    return s.split('').join('.');
  }

  findCountryCode(domain: string): CountryCode | undefined {
    return codes.find((cc: CountryCode) => domain.startsWith(cc.code));
  }
}

const reverse = (s: string): string => s.split('').reverse().join('');

class CountryCode {
  constructor(readonly code: string, readonly mappingPattern: MappingPattern, readonly dnsRoot: string) {}
}

enum MappingPattern {
  bds,
  sds,
}

// NOTE: The order IS important
const codes = [
  new CountryCode('+9999', MappingPattern.sds, '9.9.9.9.e164.arpa'),
  new CountryCode('+44', MappingPattern.bds, '44.tnum.net'),
  new CountryCode('+1', MappingPattern.bds, '44.tnum.net'),
];
