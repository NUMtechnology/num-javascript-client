import { hash, hashByDepth } from './hashutils';
import punycode from 'punycode';
import logger from 'loglevel';
import { NumBadUrlException, NumException, NumInvalidParameterException } from './exceptions';
import { URL } from 'url';

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
  getIndependentLocation(moduleId: number): string;
  getHostedLocation(moduleId: number): string;
  isDomainRoot(): boolean;
  getPopulatorLocation(moduleId: number): string | null;
  getRootIndependentLocation(moduleId: number): string;
  getRootHostedLocation(moduleId: number): string;
  validate(numId: string, moduleId: number): void;
}

/**
 * Email lookup generator
 */
export interface EmailLookupGenerator extends LookupGenerator {
  getDistributedHostedLocation(moduleId: number, levels: number): string;
  getDistributedIndependentLocation(moduleId: number, levels: number): string;
}

/**
 * Creates domain lookup generator
 * @param numId
 * @returns domain lookup generator
 */
export function createDomainLookupGenerator(numId: string): LookupGenerator {
  return new DomainLookupGenerator(numId);
}

/**
 * Creates email lookup generator
 * @param numId
 * @returns email lookup generator
 */
export function createEmailLookupGenerator(numId: string): EmailLookupGenerator {
  return new EmailLookupGeneratorImpl(numId);
}

/**
 * Creates url lookup generator
 * @param numId
 * @returns url lookup generator
 */
export function createUrlLookupGenerator(numId: string): LookupGenerator {
  return new UrlLookupGenerator(numId);
}

/**
 * Base lookup generator
 */
class BaseLookupGenerator implements LookupGenerator {
  protected _numId: string;
  protected _branch: string | null;
  protected _domain: string;

  /**
   * Creates an instance of base lookup generator.
   * @param numId
   */
  constructor(numId: string) {
    this._numId = numId;
    this._branch = null;
    this._domain = '';
  }

  /**
   * Gets branch
   */
  get branch() {
    return this._branch;
  }

  /**
   * Gets domain
   */
  get domain() {
    return this._domain;
  }

  /**
   * Gets independent location
   * @param moduleId
   * @returns
   */
  getIndependentLocation(moduleId: number) {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   * @param moduleId
   * @returns
   */
  getHostedLocation(moduleId: number) {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Determines whether domain root is
   * @returns
   */
  isDomainRoot() {
    return this._branch === null || this._branch === '';
  }

  /**
   * Gets populator location
   * @param moduleId
   * @returns
   */
  getPopulatorLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return this.isDomainRoot() ? `${moduleId}.${DNPREFIX}${this._domain}.${POP_3LZ}.${TLZ}.` : null;
  }

  /**
   * Gets root independent location
   * @param moduleId
   * @returns
   */
  getRootIndependentLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return `${moduleId}${_NUM}${this._domain}.`;
  }

  /**
   * Gets root independent location no module number
   * @param addTrailingDot
   * @returns
   */
  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `_num.${this._domain}.`;
    } else {
      return `_num.${this._domain}`;
    }
  }

  /**
   * Gets root hosted location
   * @param moduleId
   * @returns
   */
  getRootHostedLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   * @param addTrailingDot
   * @returns
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}`;
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
function transformBranch(s: string): string | null {
  if (s === '/') {
    return null;
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
  let result = '';
  if (path.length > 0) {
    const pathComponents = path.split(/\//);
    const nonEmptyPathComponents = pathComponents.filter((s) => s && s.length > 0);

    if (nonEmptyPathComponents.length > 0 && nonEmptyPathComponents[nonEmptyPathComponents.length - 1].includes('.')) {
      // Ignore the first item (i.e. last item before it was reversed) if it contains a '.' character
      nonEmptyPathComponents.pop();
    }

    if (nonEmptyPathComponents.length > 0) {
      result = '/' + nonEmptyPathComponents.join('/').split(' ').join('_');
    }
  }

  return result;
}

/**
 * Domain lookup generator
 */
class DomainLookupGenerator extends BaseLookupGenerator implements LookupGenerator {
  constructor(numId: string) {
    super(numId);
    const i = numId.indexOf('/');

    if (i > -1) {
      const branch = transformBranch(numId);
      this._branch = branch ? punycode.toASCII(branch) : branch;

      if (branch !== this._branch) {
        logger.debug(`Query ${branch} punycode ${this._branch}`);
      }

      if (this._branch !== null && (this._branch === '/' || this._branch.length === 0)) {
        this._branch = null;
      }

      this._domain = normaliseDomainName(numId.substring(0, i));
    } else {
      this._domain = normaliseDomainName(numId);
    }
  }

  validate(numId: string, moduleId: number) {
    if (moduleId < 0) {
      throw new NumInvalidParameterException('The moduleId cannot be less than 1');
    }

    if (numId.trim().length === 0) {
      throw new NumInvalidParameterException('The domainName cannot be empty');
    }
  }
}

/**
 * Email lookup generator
 */
class EmailLookupGeneratorImpl extends BaseLookupGenerator implements EmailLookupGenerator {
  private readonly _localPart: string;

  constructor(numId: string) {
    super(numId);

    const atIndex = numId.indexOf('@');
    const localPart = numId.substring(0, atIndex);
    this._localPart = localPart ? punycode.toASCII(localPart) : localPart;

    const slashIndex = numId.indexOf('/');
    if (slashIndex > -1) {
      this._domain = normaliseDomainName(numId.substring(atIndex + 1, slashIndex));

      const branch = transformBranch(normalisePath(numId.substring(slashIndex)));

      this._branch = branch ? punycode.toASCII(branch) : branch;

      if (branch !== this._branch) {
        logger.debug(`Query ${branch} punycode ${this._branch}`);
      }
    } else {
      this._domain = normaliseDomainName(numId.substring(atIndex + 1));
    }
  }

  /**
   * Gets local part
   */
  get localPart() {
    return this._localPart;
  }

  /**
   * Gets independent location
   * @param moduleId
   * @returns independent location
   */
  getIndependentLocation(moduleId: number): string {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets hosted location
   * @param moduleId
   * @returns hosted location
   */
  getHostedLocation(moduleId: number): string {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets populator location
   * @param moduleId
   * @returns populator location
   */
  getPopulatorLocation(moduleId: number): string {
    logger.info(`getPopulatorLocation called on email with ${moduleId}`);
    return '';
  }

  /**
   * Gets root independent location
   * @param moduleId
   * @returns root independent location
   */
  getRootIndependentLocation(moduleId: number): string {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}.`;
  }

  /**
   * Gets root independent location no module number
   * @param addTrailingDot
   * @returns root independent location no module number
   */
  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}.`;
    } else {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}`;
    }
  }

  /**
   * Gets root hosted location
   * @param moduleId
   * @returns root hosted location
   */
  getRootHostedLocation(moduleId: number): string {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}.`;
  }

  /**
   * Gets root hosted location no module number
   * @param addTrailingDot
   * @returns root hosted location no module number
   */
  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}`;
    }
  }

  /**
   * Gets distributed independent location
   * @param moduleId
   * @param levels
   * @returns distributed independent location
   */
  getDistributedIndependentLocation(moduleId: number, levels: number): string {
    this.validate(this._numId, moduleId);
    const emailLocalPartHash = hashByDepth(this._localPart, levels);
    const result = `${moduleId}.${DNPREFIX}${this._localPart}${emailLocalPartHash}.${EMAIL_SEP}${_NUM}${this._domain}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Gets distributed hosted location
   * @param moduleId
   * @param levels
   * @returns distributed hosted location
   */
  getDistributedHostedLocation(moduleId: number, levels: number): string {
    this.validate(this._numId, moduleId);
    const emailLocalPartHash = hashByDepth(this._localPart, levels);
    const result = `${moduleId}.${DNPREFIX}${this._localPart}${emailLocalPartHash}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${hash(this._domain)}.${TLZ}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  /**
   * Validates email lookup generator
   * @param numId
   * @param moduleId
   */
  validate(numId: string, moduleId: number) {
    if (numId.trim().length === 0) {
      throw new NumInvalidParameterException('The email address cannot be empty');
    }

    if (moduleId < 0) {
      throw new NumInvalidParameterException('The moduleId cannot be less than 0');
    }

    if (!numId.includes('@')) {
      throw new NumInvalidParameterException("The email address is invalid - missing '@'");
    }

    const emailAddressParts = numId.split('@');
    if (emailAddressParts.length !== 2 || emailAddressParts[0].length === 0) {
      throw new NumInvalidParameterException('The email address is invalid - the local part or the domain name is empty');
    }
  }
}

/**
 * Url lookup generator
 */
class UrlLookupGenerator extends BaseLookupGenerator implements LookupGenerator {
  constructor(numId: string) {
    super(numId);
    try {
      const url = new URL(numId);

      this._domain = normaliseDomainName(url.host);
      this._branch = url.pathname;

      if (this._branch === '/' || this._branch.length === 0) {
        this._branch = null;
      } else {
        const branch = transformBranch(normalisePath(this._branch));
        this._branch = branch ? punycode.toASCII(branch) : branch;

        if (branch !== this._branch) {
          logger.debug(`Query ${branch} punycode ${this._branch}`);
        }
      }
    } catch (e) {
      if (e instanceof NumException) {
        throw e;
      } else {
        throw new NumBadUrlException(`Url ${this._numId} could not be parsed`, e);
      }
    }
  }

  /**
   * Validates url lookup generator
   * @param numId
   * @param moduleId
   */
  validate(numId: string, moduleId: number) {
    if (moduleId < 0) {
      throw new NumInvalidParameterException('The moduleId cannot be less than 0');
    }

    if (numId.trim().length === 0) {
      throw new NumInvalidParameterException('The domainName cannot be empty');
    }
  }
}
