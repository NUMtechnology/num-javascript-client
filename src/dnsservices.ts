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
import { AxiosProxy } from './axiosproxy';
import { createDnsClient, DnsClient, DoHResolver, Question } from './dnsclient';
import { NumLookupBadDoHResponse, NumLookupEmptyResult, RrSetHeaderFormatException, RrSetIncompleteException } from './exceptions';

const MATCH_MULTIPART_RECORD_FRAGMENT = /(^\d+\|.*)|(\d+\/\d+\|@n=\d+;.*)/;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Dns services
 */
export interface DnsServices {
  setTimeout(t: number): void;
  getRecordFromDns(query: string, checkDnsSecValidity: boolean): Promise<string>;
}

/**
 * Creates dns services
 *
 * @param timeout the DNS request timeout in milliseconds
 * @param [DoHResolver]
 * @returns dns services
 */
export const createDnsServices = (timeout: number, resolvers: Array<DoHResolver>, proxy?: AxiosProxy): DnsServices =>
  new DnsServicesImpl(timeout, resolvers, proxy);

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------

/**
 * Dns services impl
 */
class DnsServicesImpl implements DnsServices {
  private dnsClients: Array<DnsClient>;
  private clientIndex: number;

  /**
   * Creates an instance of dns services impl.
   *
   * @param [dnsClient]
   */
  constructor(timeout: number, resolvers: Array<DoHResolver>, proxy?: AxiosProxy) {
    this.dnsClients = resolvers.map((r) => createDnsClient(timeout, r, proxy));
    this.clientIndex = 0;
  }

  /**
   * Set the DNS request timeout.
   *
   * @param t the DNS request timeout in milliseconds
   */
  setTimeout(t: number): void {
    this.dnsClients.forEach((c) => {
      c.setTimeout(t);
    });
  }

  /**
   * Rebuilds txt record content
   *
   * @param records
   * @returns txt record content
   */
  rebuildTxtRecordContent(records: string[]): string {
    const ordered = new Map<number, string>();

    if (records) {
      let total = records.length;
      let skipped = 0;
      for (const data of records) {
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

      if (total !== records.length - skipped) {
        // incomplete set
        const msg =
          skipped === 1
            ? `Parts and records length do not match, found ${total} records but 1 could not be identified as a NUM record fragment.`
            : `Parts and records length do not match, found ${total} records but ${skipped} could not be identified as NUM record fragments.`;
        throw new RrSetIncompleteException(msg);
      }

      const sortedKeys = Array.from(ordered.keys());
      sortedKeys.sort((a, b) => a - b);

      let buffer = '';

      sortedKeys.forEach((k) => {
        buffer += ordered.get(k);
      });

      return buffer;
    }

    return '';
  }

  /**
   * Gets record from dns
   *
   * @param query
   * @param checkDnsSecValidity
   * @returns record from dns
   */
  async getRecordFromDns(query: string, checkDnsSecValidity: boolean): Promise<string> {
    return this._getRecordFromDns(query, checkDnsSecValidity, 5, this.clientIndex);
  }

  /**
   * Gets record from dns
   *
   * @param query
   * @param checkDnsSecValidity
   * @returns record from dns
   */
  async _getRecordFromDns(query: string, checkDnsSecValidity: boolean, attempts: number, dohIndex: number): Promise<string> {
    if (attempts === 0) {
      throw new NumLookupEmptyResult();
    }

    const question = new Question(query, 'TXT', checkDnsSecValidity);

    dohIndex = this.findActiveResolver(dohIndex);

    log.debug(`Using DoH: ${this.dnsClients[dohIndex].getResolver().name}`);

    return this.dnsClients[dohIndex]
      .query(question)
      .then((result) => {
        log.debug(`Performed dns lookup ${JSON.stringify(question)} and got ${JSON.stringify(result)}`);

        const rebuiltModlRecord = this.rebuildTxtRecordContent(result);
        // Punydecode the result.
        return punydecode(rebuiltModlRecord);
      })
      .catch((e) => {
        if (e && typeof e === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (e.status && e.status !== 0) {
            throw new NumLookupBadDoHResponse();
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (e.message === 'Found spf' || e.message === 'Found CNAME') {
            return '';
          }
        }

        // The current resolver failed so disable it for a while.
        log.info(`The current resolver failed so disable it for a while: ${this.dnsClients[dohIndex].getResolver().name}`);
        this.dnsClients[dohIndex].getResolver().disableForSeconds(5);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        dohIndex = this.findActiveResolver(dohIndex);

        log.warn(`Switching to DoH: ${this.dnsClients[dohIndex].getResolver().name} due to ${JSON.stringify(e)}`);

        return this._getRecordFromDns(query, checkDnsSecValidity, attempts - 1, dohIndex);
      });
  }

  private findActiveResolver(dohIndex: number): number {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.dnsClients.length; i++) {
      if (this.dnsClients[dohIndex].getResolver().isActive()) {
        log.info(`Found an active resolver: ${this.dnsClients[dohIndex].getResolver().name}`);
        break;
      }
      // Change the client we're using and try again
      dohIndex = (dohIndex + 1) % this.dnsClients.length;
    }
    // If we can't find an active resolver then throw an exception.
    if (!this.dnsClients[dohIndex].getResolver().isActive()) {
      log.info("Can't find an active resolver so aborting.");
      throw new NumLookupBadDoHResponse();
    }
    return dohIndex;
  }
}

export const punydecode = (rec: string): string => (rec && rec.includes(';@pn=1;') ? punycode.decode(rec).replace('@pn=1;', '') : rec);
