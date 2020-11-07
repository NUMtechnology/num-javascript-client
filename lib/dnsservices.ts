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

import { Answer, createDnsClient, DnsClient, Question } from './dnsclient';
import log from 'loglevel';
import { NumException, RrSetHeaderFormatException, RrSetIncompleteException } from './exceptions';

const MATCH_MULTIPART_RECORD_FRAGMENT = /(^\d+\|.*)|(\d+\/\d+\|@n=\d+;.*)/;
const TXT = 16;

export interface DnsServices {
  getRecordFromDns(query: string, checkDnsSecValidity: boolean): Promise<Answer[]>;
}

export function createDnsServices(dnsClient?: DnsClient): DnsServices {
  return new DnsServicesImpl(dnsClient);
}

class DnsServicesImpl implements DnsServices {
  private dnsClient: DnsClient;

  constructor(dnsClient?: DnsClient) {
    this.dnsClient = dnsClient ? dnsClient : createDnsClient();
  }

  /**
   * Check if the query is valid
   *
   * @param {String} query
   * @returns {Boolean}
   */
  isQueryValid(query: string): boolean {
    return query.trim().length !== 0;
  }

  /**
   * Concatenate an array of TXT record values to a single String
   *
   * @param {Array} records The array of Records
   * @returns {String} The concatenated result.
   */
  rebuildTxtRecordContent(records: Answer[]): string {
    const ordered = new Map<number, string>();

    if (records) {
      let total = records.length;
      let skipped = 0;
      for (const record of records) {
        if (record.data) {
          const data = record.data.toString();

          if (MATCH_MULTIPART_RECORD_FRAGMENT.test(data)) {
            const pipeIndex = data.indexOf('|');

            if (pipeIndex >= 0) {
              const parts = [data.substring(0, pipeIndex), data.substring(pipeIndex + 1)];

              const dataMinusHeader = data.substring(parts[0].length + 1);
              if (parts[0].includes('/')) {
                ordered.set(0, dataMinusHeader);

                const firstParts = parts[0].split('/');

                if (firstParts.length === 2) {
                  total = parseInt(firstParts[1], 10);

                  if (isNaN(total)) {
                    throw new RrSetHeaderFormatException(`Could not parse total parts ${firstParts[1]}`);
                  }
                } else {
                  throw new RrSetHeaderFormatException('First part should only contain 1 "/", format is incorrect!');
                }
              } else {
                const index = parseInt(parts[0], 10);

                if (isNaN(index)) {
                  throw new RrSetHeaderFormatException(`Could not parse index ${parts[0]}`);
                }

                ordered.set(index - 1, dataMinusHeader);
              }
            }
          } else {
            if (records.length === 1) {
              ordered.set(0, data);
            } else {
              skipped++;
            }
          }
        }
      }

      if (total !== records.length - skipped) {
        // incomplete set
        if (skipped === 1) {
          throw new RrSetIncompleteException(
            `Parts and records length do not match, found ${total} records but ${skipped} could not be identified as a NUM record fragment.`
          );
        } else {
          throw new RrSetIncompleteException(
            `Parts and records length do not match, found ${total} records but ${skipped} could not be identified as NUM record fragments.`
          );
        }
      }

      const keys = [...ordered.keys()].sort((a, b) => a - b);
      let buffer = '';
      for (const k of keys) {
        buffer += ordered.get(k);
      }
      return buffer;
    }

    return '';
  }

  /**
   * Get a NUM record from DNS.
   *
   * @param {String} query The NUM formatted DNS query.
   * @param {Boolean} checkDnsSecValidity true if the result should be checked for DNSSEC validity.
   * @returns {Array} An array of Records
   */
  async getRecordFromDns(query: string, checkDnsSecValidity: boolean): Promise<Answer[]> {
    log.info(`Skipping checkDnsSecValidity (value): ${checkDnsSecValidity}`);
    try {
      const question = new Question(query, TXT, checkDnsSecValidity);

      if (question.name !== query) {
        log.debug(`Query ${query} punycode ${question.name}`);
      }

      const result = await this.dnsClient.query(question);

      log.debug(`Performed dns lookup ${JSON.stringify(question)} and got ${JSON.stringify(result)}`);
      return result;
    } catch (e) {
      if (e instanceof NumException) {
        throw e;
      }
      log.warn('Unknown exception.', e);
    }
    return [];
  }
}
