import { HashUtils } from './hashutils';
import punycode from 'punycode';
import logger from 'loglevel';
import { NumBadUrlException, NumException, NumInvalidParameterException } from './exceptions';
import { URL } from 'url';

const _NUM = '._num.';
const DNPREFIX = '_';
const TLZ = 'num.net';
const EMAIL_SEP = 'e';

export interface LookupGenerator {
  getIndependentLocation(moduleId: number);

  getHostedLocation(moduleId: number);

  isDomainRoot();

  getPopulatorLocation(moduleId: number);

  getRootIndependentLocation(moduleId: number);

  getRootHostedLocation(moduleId: number);

  validate(numId: string, moduleId: number);
}

class BaseLookupGenerator implements LookupGenerator {
  protected _numId: string;
  protected _branch: string | null;
  protected _domain: string;

  constructor(numId: string) {
    this._numId = numId;
    this._branch = null;
    this._domain = '';
  }

  get branch() {
    return this._branch;
  }

  get domain() {
    return this._domain;
  }

  getIndependentLocation(moduleId: number) {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  getHostedLocation(moduleId: number) {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  isDomainRoot() {
    return this._branch === null || this._branch === '';
  }

  getPopulatorLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return this.isDomainRoot() ? `${moduleId}.${DNPREFIX}${this._domain}.populator.${TLZ}.` : null;
  }

  getRootIndependentLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return `${moduleId}${_NUM}${this._domain}.`;
  }

  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `_num.${this._domain}.`;
    } else {
      return `_num.${this._domain}`;
    }
  }

  getRootHostedLocation(moduleId: number) {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}.`;
  }

  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean) {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}`;
    }
  }

  validate(_numId: string, _moduleId: number) {
    throw new Error('Not implemented');
  }
}

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

function normaliseDomainName(domainName: string): string {
  if (!domainName) {
    throw new NumInvalidParameterException('Null domain name cannot be normalised');
  }

  if (domainName.trim() === '') {
    throw new NumInvalidParameterException('Empty domain name cannot be normalised');
  }

  if (domainName.startsWith('http')) {
    try {
      const url = new URL(domainName);
      const host = url.host;
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
export class DomainLookupGenerator extends BaseLookupGenerator {
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

export class EmailLookupGenerator extends BaseLookupGenerator {
  private _localPart: string;
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

  get localPart() {
    return this._localPart;
  }

  getIndependentLocation(moduleId: number): string {
    const result = this.getRootIndependentLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  getHostedLocation(moduleId: number): string {
    const result = this.getRootHostedLocation(moduleId);
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  getPopulatorLocation(moduleId: number): string {
    logger.info(`getPopulatorLocation called on email with ${moduleId}`);
    return '';
  }

  getRootIndependentLocation(moduleId: number): string {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}.`;
  }

  getRootIndependentLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}.`;
    } else {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}${_NUM}${this._domain}`;
    }
  }

  getRootHostedLocation(moduleId: number): string {
    this.validate(this._numId, moduleId);
    return `${moduleId}.${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}.`;
  }

  getRootHostedLocationNoModuleNumber(addTrailingDot: boolean): string {
    if (addTrailingDot) {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}.`;
    } else {
      return `${DNPREFIX}${this._localPart}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${HashUtils.hash(this._domain)}.${TLZ}`;
    }
  }

  getDistributedIndependentLocation(moduleId: number, levels: number): string {
    this.validate(this._numId, moduleId);
    const emailLocalPartHash = HashUtils.hashByDepth(this._localPart, levels);
    const result = `${moduleId}.${DNPREFIX}${this._localPart}${emailLocalPartHash}.${EMAIL_SEP}${_NUM}${this._domain}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

  getDistributedHostedLocation(moduleId: number, levels: number): string {
    this.validate(this._numId, moduleId);
    const emailLocalPartHash = HashUtils.hashByDepth(this._localPart, levels);
    const result = `${moduleId}.${DNPREFIX}${this._localPart}${emailLocalPartHash}.${EMAIL_SEP}.${DNPREFIX}${this._domain}${HashUtils.hash(
      this._domain
    )}.${TLZ}.`;
    return this.isDomainRoot() ? result : `${this._branch}.${result}`;
  }

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

export class UrlLookupGenerator extends BaseLookupGenerator {
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

  validate(numId: string, moduleId: number) {
    if (moduleId < 0) {
      throw new NumInvalidParameterException('The moduleId cannot be less than 0');
    }

    if (numId.trim().length === 0) {
      throw new NumInvalidParameterException('The domainName cannot be empty');
    }
  }
}
