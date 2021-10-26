/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import log from 'loglevel';
import punycode from 'punycode';
import { AxiosProxy, axiosProxy } from './axiosproxy';
import { BadDnsStatusException, InvalidDnsResponseException } from './exceptions';

const NXDOMAIN = 3;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * DoHresolver
 */
export class DoHResolver {
  constructor(readonly name: string, readonly url: string) {}
}

/**
 * Question
 */
export class Question {
  readonly name: string;
  readonly type: number | string;
  readonly dnssec: boolean;

  constructor(name: string, type: number | string, dnssec: boolean) {
    this.name = punycode.toASCII(name);
    this.type = type;
    this.dnssec = dnssec;
    if (this.name !== name) {
      log.debug(`Query ${name} punycode ${this.name}`);
    }
  }
}

/**
 * Dns client
 */
export interface DnsClient {
  /**
   * Set the DNS request timeout in milliseconds.
   *
   * @param t the timeout
   */
  setTimeout(t: number);

  /**
   *
   * @param question
   * @returns query
   */
  query(question: Question): Promise<string[]>;

  getResolver(): DoHResolver;
}

/**
 * Creates dns client
 *
 * @param timeout for the axios query
 * @param resolver the DoHResolver
 * @param proxy the AxiosProxy instance if not the default
 * @returns dns client
 */
export const createDnsClient = (timeout: number, resolver: DoHResolver, proxy?: AxiosProxy): DnsClient =>
  new DnsClientImpl(timeout, resolver, proxy ? proxy : axiosProxy);

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------
/**
 * Answer
 */
export interface Answer {
  readonly name: string;
  readonly type: number;
  readonly data: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly TTL: number;
}

/**
 * Dns client
 */
class DnsClientImpl implements DnsClient {
  private readonly resolver: DoHResolver;
  private timeout: number;
  private readonly axiosProxy: AxiosProxy;

  /**
   * Creates an instance of dns client impl.
   *
   * @param [resolver]
   */
  constructor(timeout: number, resolver: DoHResolver, proxy: AxiosProxy) {
    this.resolver = resolver;
    this.timeout = timeout;
    this.axiosProxy = proxy;
    log.info(`DNS client configured with resolver: ${this.resolver.url}`);
  }

  setTimeout(t: number) {
    this.timeout = t;
  }

  getResolver(): DoHResolver {
    return this.resolver;
  }

  /**
   * Querys dns client impl
   *
   * @param question
   * @returns query
   */
  async query(question: Question): Promise<string[]> {
    let data: string[] = [];

    try {
      data = await this.queryUsingResolver(question, this.resolver);
    } catch (err) {
      if (err instanceof BadDnsStatusException) {
        if (err.status === NXDOMAIN) {
          log.warn('Bad DNS status - NXDOMAIN');
        } else {
          log.warn(`Error resolving ${question.name} with ${this.resolver.name}`);
        }
      } else {
        log.warn(`Error resolving ${question.name} with ${this.resolver.name}. ${JSON.stringify(err)}`);
        throw err;
      }
    }

    return data;
  }

  /**
   * Querys using resolver
   *
   * @param question
   * @param resolver
   * @returns using resolver
   */
  async queryUsingResolver(question: Question, resolver: DoHResolver): Promise<string[]> {
    log.info(`Query made using ${resolver.name} for the DNS ${question.type} record(s) at ${question.name} dnssec:${question.dnssec.toString()}`);

    const params = `name=${question.name}&type=${question.type}&dnssec=` + (question.dnssec ? '1' : '0') + '&ct=application/dns-json';
    const url = `${resolver.url}?${params}`;

    const response = await this.axiosProxy.get(url, { timeout: this.timeout });

    if (response.data) {
      if (response.data.Status === 0) {
        if (response.data.Answer) {
          const data = response.data.Answer as Answer[];
          const answerName = data[0].name.endsWith('.') ? data[0].name : data[0].name + '.';
          if (question.name !== answerName) {
            log.error(`Q = ${JSON.stringify(question)}, A = ${JSON.stringify(data[0])}`);
          }

          return data.map(joinParts);
        } else {
          log.warn('Domain was resolved but no records were found');
          return [];
        }
      } else if (response.data.AD && question.dnssec) {
        log.warn('DNSSEC checks not implemented.');
        return [];
      } else if (response.data.Status === NXDOMAIN) {
        throw new BadDnsStatusException(response.data.Status, 'Response is NXDOMAIN');
      } else {
        throw new BadDnsStatusException(response.data.Status, 'Status from service should be 0 if resolution was successful');
      }
    } else {
      throw new Error('Response was empty');
    }
  }
}

/**
 * Joins parts
 *
 * @param item
 * @returns parts
 */
const joinParts = (item: Answer): string => {
  if (item.type === 5) {
    throw new InvalidDnsResponseException('Found CNAME');
  }

  if (item.data.startsWith('v=spf') || item.data.startsWith('"v=spf')) {
    throw new InvalidDnsResponseException('Found spf');
  }

  const joined = item.data
    .split('"')
    .filter((i) => i.trim().length > 0)
    .join('')
    .split('\\;')
    .join(';')
    .split('\\ ')
    .join(' ');

  log.debug(`Joined data ${joined}`);
  return joined;
};
