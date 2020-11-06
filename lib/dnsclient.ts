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
 * Do hresolver
 */
export class DoHResolver {
  constructor(readonly name: string, readonly url: string, readonly params: string[]) {}
}

const GOOGLE_RESOLVER = new DoHResolver('Google', 'https://dns.google.com/resolve', ['name', 'type', 'dnssec']);

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
    this.dnssec = false;
  }
}

/**
 * Dns client
 */
export default class DnsClient {
  private resolver: DoHResolver;

  /**
   * Creates an instance of dns client.
   * @param [resolver]
   */
  constructor(resolver?: DoHResolver) {
    this.resolver = resolver ? resolver : GOOGLE_RESOLVER;

    logger.info(`DNS client configured with resolver: ${this.resolver.url}`);
  }

  /**
   * Querys dns client
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
          logger.error('Bad DNS status - NXDOMAIN - skipping other services', err);
        } else {
          logger.error(`Error resolving ${question.name} with ${this.resolver.name}`, err);
        }
      } else {
        logger.error(`Error resolving ${question.name} with ${this.resolver.name}.`, err);
      }
    }

    if (data.length === 0) {
      // All resolvers tried. No data obtained
      logger.warn('Resolver failed or aborted.');
      throw new Error('Resolver failed or aborted.');
    }

    return data;
  }

  /**
   * Query using resolver
   * @param {Question} question
   * @param {Object} resolver
   * @returns {Object} any answers
   */
  async queryUsingResolver(question: Question, resolver: DoHResolver): Promise<Answer[]> {
    if (resolver) {
      logger.info(`Query made using ${resolver.name} for the DNS ${question.type} record(s) at ${question.name} dnssec:${question.dnssec}`);

      try {
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
            // NOTE... since this is done by the resolver this should be dsnsec failed
            throw new NumNotImplementedException('DNSSEC checks not implemented.');
          } else if (response.data.Status === NXDOMAIN) {
            logger.info('Received NXDOMAIN response');
            return [];
          } else {
            throw new BadDnsStatusException(response.data.Status, 'Status from service should be 0 if resolution was successful');
          }
        } else {
          throw new Error('Response was empty');
        }
      } catch (err) {
        // We've received an answer, but sometimes when querying domains that include some characters
        // e.g. the ampersand, the JSON response is invalid.
        logger.warn(`Error resolving question ${JSON.stringify(question)}: ${JSON.stringify(err)}`);

        throw err;
      }
    } else {
      logger.error('Resolver is null');
    }

    return [];
  }
}

/**
 * Answer
 */
interface Answer {
  name: string;
  type: number;
  data: string;
  TTL: number;
}
