import { hash, hashByDepth } from './hashutils';
import punycode from 'punycode';
import log from 'loglevel';
import { NumBadUrlException, NumException, NumInvalidParameterException } from './exceptions';
import { URL } from 'url';
import { Hostname, NO_USER_INFO, NumUri, PositiveInteger, UrlUserInfo } from './numuri';

const _NUM = '._num.';
const DNPREFIX = '_';
const TLZ = 'num.net';
const EMAIL_SEP = 'e';
const POP_3LZ = 'populator';

/**
 * Lookup generator
 */
export interface LookupGenerator {
  getRootIndependentLocationNoModuleNumber(arg0: boolean): any;
  getRootHostedLocationNoModuleNumber(arg0: boolean): any;
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
 * @param numId
 * @returns domain lookup generator
 */
export function createDomainLookupGenerator(numUri: NumUri): LookupGenerator {
  return new DomainLookupGenerator(numUri);
}

/**
 * Creates email lookup generator
 * @param numId
 * @returns email lookup generator
 */
export function createEmailLookupGenerator(numUri: NumUri): EmailLookupGenerator {
  return new EmailLookupGeneratorImpl(numUri);
}

/**
 * Creates url lookup generator
 * @param numId
 * @returns url lookup generator
 */
export function createUrlLookupGenerator(numUri: NumUri): LookupGenerator {
  return new UrlLookupGenerator(numUri);
}

/**
 * Base lookup generator
 */
class BaseLookupGenerator implements LookupGenerator {
  protected _numUri: NumUri;
  protected _branch: string;

  /**
   * Creates an instance of base lookup generator.
   * @param numId
   */
  constructor(numUri: NumUri) {
    this._numUri = numUri;
    this._branch = '';
  }

  /**
   * Gets independent location
   * @param moduleId
   * @returns
   */
  getIndependentLocation(moduleId: PositiveInteger) {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   * @param moduleId
   * @returns
   */
  getHostedLocation(moduleId: PositiveInteger) {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Determines whether domain root is
   * @returns
   */
  isDomainRoot() {
    return this._branch === '';
  }

  /**
   * Gets populator location
   * @param moduleId
   * @returns
   */
  getPopulatorLocation(moduleId: PositiveInteger) {
    return this.isDomainRoot() ? `${moduleId.n}.${DNPREFIX}${this._numUri.host.s}.${POP_3LZ}.${TLZ}.` : null;
  }

  /**
   * Gets root independent location
   * @param moduleId
   * @returns
   */
  getRootIndependentLocation(moduleId: PositiveInteger) {
    return `${moduleId.n}${_NUM}${this._numUri.host.s}.`;
  }

  /**
   * Gets root independent location no module number
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
   * @param moduleId
   * @returns
   */
  getRootHostedLocation(moduleId: PositiveInteger) {
    return `${moduleId.n}.${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   * @param addTrailingDot
   * @returns
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}`;
    }
  }

  /**
   * Validates base lookup generator
   * @param _numId
   * @param _moduleId
   */
  validate(_numId: string, _moduleId: number) {
    throw new Error('Not implemented');
  }
}

/**
 * Transforms branch
 * @param s
 * @returns branch
 */
function transformBranch(s: string): string {
  if (s === '/') {
    return '';
  }

  const i = s.indexOf('/');
  return s
    .substring(i + 1)
    .split('/')
    .reverse()
    .join('.');
}

/**
 * Normalises domain name
 * @param domainName
 * @returns domain name
 */
function normaliseDomainName(domainName: string): string {
  if (!domainName) {
    throw new NumInvalidParameterException('Null domain name cannot be normalised');
  }

  if (domainName.trim() === '') {
    throw new NumInvalidParameterException('Empty domain name cannot be normalised');
  }

  if (domainName.startsWith('http')) {
    try {
      const host = new URL(domainName).hostname;
      return normaliseDomainName(host);
    } catch (e) {
      if (e instanceof NumException) {
        throw e;
      } else {
        throw new NumBadUrlException(`Invalid URL: ${domainName}`, e);
      }
    }
  }

  let result = domainName;
  if (result.startsWith('www.')) {
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
}

/**
 * Normalises path
 * @param path
 * @returns path
 */
function normalisePath(path: string): string {
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
}

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
   * @param moduleId
   * @returns independent location
   */
  getIndependentLocation(moduleId: PositiveInteger): string {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   * @param moduleId
   * @returns hosted location
   */
  getHostedLocation(moduleId: PositiveInteger): string {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets populator location
   * @param moduleId
   * @returns populator location
   */
  getPopulatorLocation(moduleId: PositiveInteger): string | null {
    log.warn(`getPopulatorLocation called on email with ${moduleId.n}`);
    return null;
  }

  /**
   * Gets root independent location
   * @param moduleId
   * @returns root independent location
   */
  getRootIndependentLocation(moduleId: PositiveInteger): string {
    return `${moduleId.n}.${DNPREFIX}${this.localPart}.${EMAIL_SEP}${_NUM}${this._numUri.host.s}.`;
  }

  /**
   * Gets root independent location no module number
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
   * @param moduleId
   * @returns root hosted location
   */
  getRootHostedLocation(moduleId: PositiveInteger): string {
    return `${moduleId.n}.${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   * @param addTrailingDot
   * @returns root hosted location no module number
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this.localPart}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hash(this._numUri.host.s)}.${TLZ}`;
    }
  }

  /**
   * Gets distributed independent location
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
   * @param moduleId
   * @param levels
   * @returns distributed hosted location
   */
  getDistributedHostedLocation(moduleId: PositiveInteger, levels: PositiveInteger): string {
    const emailLocalPartHash = hashByDepth(this._numUri.userinfo.s, levels.n);
    const result = `${moduleId.n}.${DNPREFIX}${this.localPart}${emailLocalPartHash}.${EMAIL_SEP}.${DNPREFIX}${this._numUri.host.s}${hash(
      this._numUri.host.s
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
