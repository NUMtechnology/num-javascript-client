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

import axios from 'axios';
import { BadDnsStatusException, InvalidDnsResponseException } from './exceptions';
import punycode from 'punycode';
import log from 'loglevel';

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
   *
   * @param question
   * @returns query
   */
  query(question: Question): Promise<string[]>;
}

/**
 * Creates dns client
 *
 * @param [resolver]
 * @returns dns client
 */
export const createDnsClient = (resolver?: DoHResolver): DnsClient => new DnsClientImpl(resolver);

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------
/**
 * Answer
 */
interface Answer {
  readonly name: string;
  readonly type: number;
  readonly data: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly TTL: number;
}

const DEFAULT_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve');

/**
 * Dns client
 */
class DnsClientImpl implements DnsClient {
  private readonly resolver: DoHResolver;

  /**
   * Creates an instance of dns client impl.
   *
   * @param [resolver]
   */
  constructor(resolver?: DoHResolver) {
    this.resolver = resolver ? resolver : DEFAULT_RESOLVER;
    log.info(`DNS client configured with resolver: ${this.resolver.url}`);
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
        log.warn(`Error resolving ${question.name} with ${this.resolver.name}.`);
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

    const params = `name=${question.name}&type=${question.type}&dnssec=` + (question.dnssec ? '1' : '0');
    const url = `${resolver.url}?${params}`;

    const response = await axios.get(url);

    if (response.data) {
      if (response.data.Status === 0) {
        if (response.data.Answer) {
          const data = response.data.Answer as Answer[];

          return data.map(joinParts);
        } else {
          throw new Error('Domain was resolved but no records were found');
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
