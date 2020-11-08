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
import logger from 'loglevel';
import { BadDnsStatusException, InvalidDnsResponseException, NumNotImplementedException } from './exceptions';
import punycode from 'punycode';

const NXDOMAIN = 3;

/**
 * DoHresolver
 */
export class DoHResolver {
  constructor(readonly name: string, readonly url: string, readonly params: string[]) {}
}

/**
 * Question
 */
export class Question {
  readonly name: string;
  readonly type: number;
  readonly dnssec: boolean;

  constructor(name: string, type: number, dnssec: boolean) {
    this.name = punycode.toASCII(name);
    this.type = type;
    this.dnssec = dnssec;
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
  query(question: Question): Promise<Answer[]>;
}

/**
 * Creates dns client
 * @param [resolver]
 * @returns dns client
 */
export function createDnsClient(resolver?: DoHResolver): DnsClient {
  return new DnsClientImpl(resolver);
}

/**
 * Answer
 */
export interface Answer {
  name: string;
  type: number;
  data: string;
  TTL: number;
}

const GOOGLE_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve', ['name', 'type', 'dnssec']);

/**
 * Dns client
 */
class DnsClientImpl implements DnsClient {
  private readonly resolver: DoHResolver;

  /**
   * Creates an instance of dns client impl.
   * @param [resolver]
   */
  constructor(resolver?: DoHResolver) {
    this.resolver = resolver ? resolver : GOOGLE_RESOLVER;
    logger.info(`DNS client configured with resolver: ${this.resolver.url}`);
  }

  /**
   * Querys dns client impl
   * @param question
   * @returns query
   */
  async query(question: Question): Promise<Answer[]> {
    let data: Answer[] = [];

    try {
      data = await this.queryUsingResolver(question, this.resolver);
    } catch (err) {
      if (err instanceof BadDnsStatusException) {
        if (err.status === NXDOMAIN) {
          logger.error('Bad DNS status - NXDOMAIN', err);
        } else {
          logger.error(`Error resolving ${question.name} with ${this.resolver.name}`, err);
        }
      } else {
        logger.error(`Error resolving ${question.name} with ${this.resolver.name}.`, err);
      }
    }

    if (data.length === 0) {
      // No data obtained
      logger.warn('Resolver failed or aborted.');
    }

    return data;
  }

  /**
   * Querys using resolver
   * @param question
   * @param resolver
   * @returns using resolver
   */
  async queryUsingResolver(question: Question, resolver: DoHResolver): Promise<Answer[]> {
    logger.info(`Query made using ${resolver.name} for the DNS ${question.type} record(s) at ${question.name} dnssec:${question.dnssec}`);

    const params = `name=${question.name}&type=${question.type}&dnssec=` + (question.dnssec ? '1' : '0');
    const url = `${resolver.url}?${params}`;

    const response = await axios.get(url);

    if (response.data) {
      if (response.data.Status === 0) {
        if (response.data.Answer) {
          const data = response.data.Answer as Answer[];

          for (const item of data) {
            if (item.type === 5) {
              throw new InvalidDnsResponseException('Found CNAME');
            }

            if (item.data.startsWith('v=spf') || item.data.startsWith('"v=spf')) {
              throw new InvalidDnsResponseException('Found spf');
            }

            item.data = item.data
              .split('"')
              .filter((i) => i.trim().length > 0)
              .join('')
              .split('\\;')
              .join(';')
              .split('\\ ')
              .join(' ');

            logger.info(`Joined data ${item.data}`);
          }
          return data;
        } else {
          throw new Error('Domain was resolved but no records were found');
        }
      } else if (response.data.AD && question.dnssec) {
        throw new NumNotImplementedException('DNSSEC checks not implemented.');
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
