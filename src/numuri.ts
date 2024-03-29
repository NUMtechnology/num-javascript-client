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
import { parse } from 'url';

const DOMAIN_REGEX = new RegExp(/^(([^.\s\\\b]+?\.)*?([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?\.)([^!"#$%&'()*+,./:;<=>?@\[\]^_`{|}~\s\b]+?))\.??$/);
const TNUM_REGEX = new RegExp(/^\+\d{2,15}$/);
const USERINFO_REGEX = new RegExp(/^(?!\s)[^@\f\t\r\b\s\\]+$/);
const PATH_REGEX = new RegExp(/^(\/[^;,/\\?:@&=+$.#\s]+)*\/?$/);
const MAX_LABEL_LENGTH = 63;
const MAX_DOMAIN_NAME_LENGTH = 253;
const MAX_LOCAL_PART_LENGTH = 64;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Num uri
 */
export class NumUri {
  readonly protocol: string;
  readonly userinfo: UrlUserInfo;
  readonly port: PositiveInteger;
  readonly path: UrlPath;

  /**
   * Creates an instance of num uri.
   *
   * @param userinfo
   * @param host
   * @param port
   * @param path
   */
  constructor(readonly host: Hostname, port?: PositiveInteger, userinfo?: UrlUserInfo, path?: UrlPath) {
    this.protocol = 'num';
    this.userinfo = userinfo ? userinfo : NO_USER_INFO;
    this.port = port ? port : MODULE_0;
    this.path = path ? path : NO_PATH;
  }

  /**
   * Gets num id without the port/module number
   */
  get numId(): string {
    if (this.userinfo.s !== '') {
      return `${this.userinfo.s}@${this.host.s}${this.path.s}`;
    }
    return `${this.host.s}${this.path.s}`;
  }

  /**
   * Withs host
   *
   * @param host
   * @returns host
   */
  withHost(host: Hostname): NumUri {
    return new NumUri(host, this.port, this.userinfo, this.path);
  }

  /**
   * Withs port
   *
   * @param port
   * @returns port
   */
  withPort(port: PositiveInteger): NumUri {
    return new NumUri(this.host, port, this.userinfo, this.path);
  }

  /**
   * Withs path
   *
   * @param path
   * @returns path
   */
  withPath(path: UrlPath): NumUri {
    return new NumUri(this.host, this.port, this.userinfo, path);
  }

  /**
   * Withs userinfo
   *
   * @param userinfo
   * @returns userinfo
   */
  withUserinfo(userinfo: UrlUserInfo): NumUri {
    return new NumUri(this.host, this.port, userinfo, this.path);
  }

  /**
   * Convert the NumUri object to a string
   *
   * @returns The URI as a string
   */
  toString(): string {
    const hostPart = this.host?.s;
    const pathPart = this.path?.s !== '/' ? this.path?.s : '';
    const portPart = `:${this.port?.n}`;
    const userPart = this.userinfo?.s ? `${this.userinfo?.s}@` : '';
    return `${userPart}${hostPart}${portPart}${pathPart}`;
  }
}

/**
 * Creates num uri
 *
 * @param host
 * @param [port]
 * @param [userinfo]
 * @param [path]
 * @returns num uri
 */
export const buildNumUri = (host: string, port?: number, userinfo?: string, path?: string): NumUri => {
  const thePort = port ? new PositiveInteger(port) : MODULE_0;
  const theUserInfo = userinfo ? new UrlUserInfo(userinfo) : NO_USER_INFO;
  const thePath = path ? new UrlPath(path) : NO_PATH;
  return new NumUri(new Hostname(host), thePort, theUserInfo, thePath);
};

/**
 * Parses num uri
 *
 * @param uri
 * @returns num uri
 */
export const parseNumUri = (uri: string): NumUri => {
  const u = parse(uri.includes('://') ? uri : 'num://' + uri);
  const portNumber = notEmpty(u.port) ? Number.parseInt(u.port as string, 10) : 0;
  const hostname = u.hostname ? u.hostname : '';

  const host = new Hostname(hostname);
  const port = isPositive(portNumber) ? new PositiveInteger(portNumber) : MODULE_0;
  const userInfo = notEmpty(u.auth) ? new UrlUserInfo(u.auth as string) : NO_USER_INFO;
  const path = notEmpty(u.path) ? new UrlPath(u.path as string) : NO_PATH;

  return new NumUri(host, port, userInfo, path);
};

/**
 * N positive
 *
 * @param n
 */
const isPositive = (n: number) => n > -1;
/**
 * S not empty
 *
 * @param s
 */
const notEmpty = (s: string | null) => s && s.length > 0;

/**
 * Positive integer
 */
export class PositiveInteger {
  /**
   * Creates an instance of positive integer.
   *
   * @param n
   */
  constructor(readonly n: number) {
    // n must be a positive integer
    if (!(isPositive(n) && Number.isInteger(n))) {
      throw new Error(`Value should be zero or a positive integer: ${n}`);
    }
  }
}

export const MODULE_0 = new PositiveInteger(0);
export const MODULE_1 = new PositiveInteger(1);
export const MODULE_2 = new PositiveInteger(2);
export const MODULE_3 = new PositiveInteger(3);
export const MODULE_4 = new PositiveInteger(4);
export const MODULE_5 = new PositiveInteger(5);
export const MODULE_6 = new PositiveInteger(6);
export const MODULE_7 = new PositiveInteger(7);
export const MODULE_8 = new PositiveInteger(8);
export const MODULE_9 = new PositiveInteger(9);
export const MODULE_10 = new PositiveInteger(10);

/**
 * Hostname
 */
export class Hostname {
  readonly s: string;
  /**
   * Creates an instance of hostname.
   *
   * @param name
   */
  constructor(name: string) {
    this.s = name.toLowerCase();
    if (!Hostname.isValid(this.s)) {
      throw new Error(`Invalid domain name: '${this.s}'`);
    }
    this.s.split('.').forEach((i) => {
      if (i.length > MAX_LABEL_LENGTH) {
        throw new Error(`Invalid domain name: '${this.s}'`);
      }
    });
  }

  static isValid(s: string): boolean {
    const domainMatches = DOMAIN_REGEX.exec(s);
    return (s.length <= MAX_DOMAIN_NAME_LENGTH && domainMatches !== null && domainMatches.length > 0) || Hostname.isValidTNUM(s);
  }

  static isValidTNUM(s: string): boolean {
    const tnumMatches = TNUM_REGEX.exec(s);
    return tnumMatches !== null && tnumMatches.length > 0;
  }
}

/**
 * Url path
 */
export class UrlPath {
  readonly s: string;
  /**
   * Creates an instance of url path.
   *
   * @param path
   */
  constructor(readonly path: string) {
    this.s = path.toLowerCase();

    if (!this.s.startsWith('/') || !PATH_REGEX.exec(this.s)) {
      throw new Error(`Invalid URL path: '${this.s}'`);
    }
    if (this.s !== '/') {
      // Check each path component
      this.s
        .substr(1)
        .split('/')
        .forEach((pc) => {
          if (pc.length === 0) {
            throw new Error(`Invalid URL path: '${this.s}' - zero length path component`);
          }
          if (pc.length > MAX_LABEL_LENGTH) {
            throw new Error(`Invalid URL path: '${pc}' - path component too long`);
          }
          if (pc.includes(' ')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains space`);
          }
          if (pc.includes('\n')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains newline`);
          }
          if (pc.includes('\r')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains carriage return`);
          }
          if (pc.includes('\t')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains tab`);
          }
          if (pc.includes('\b')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains backspace`);
          }
          if (pc.includes('\f')) {
            throw new Error(`Invalid URL path: '${pc}' - path component contains formfeed`);
          }
        });
    }
  }
}

export const NO_PATH = new UrlPath('/');

/**
 * Url user info
 */
export class UrlUserInfo {
  readonly s: string;
  /**
   * Creates an instance of url user info.
   *
   * @param uinfo
   */
  constructor(readonly uinfo: string) {
    this.s = uinfo.toLowerCase();
    if (
      (notEmpty(this.s) && !USERINFO_REGEX.exec(this.s)) ||
      this.s.length > MAX_LOCAL_PART_LENGTH ||
      this.s.startsWith('.') ||
      this.s.endsWith('.') ||
      this.s.includes('..') ||
      this.s.includes('\\') ||
      this.s.includes('\n') ||
      this.s.includes('\r') ||
      this.s.includes('\t') ||
      this.s.includes('\b') ||
      this.s.includes('\f')
    ) {
      throw new Error(`Invalid URL userinfo: ${this.s}`);
    }
  }
}

export const NO_USER_INFO = new UrlUserInfo('');
