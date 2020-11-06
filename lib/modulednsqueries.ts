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

import { NumInvalidDnsQueryException, NumInvalidParameterException, NumInvalidRedirectException } from './exceptions';
import { EmailLookupGenerator, DomainLookupGenerator, UrlLookupGenerator } from './lookupgenerators';
import logger from 'loglevel';

export class ModuleDnsQueries {
  private moduleId: number;
  private numId: string;
  private independentRecordLocation: string;
  private rootIndependentRecordLocation: string;
  private hostedRecordLocation: string;
  private rootHostedRecordLocation: string;

  constructor(moduleId: number, numId: string) {
    if (moduleId < 0) {
      throw new NumInvalidParameterException('moduleId cannot be negative');
    }

    if (numId.trim().length === 0) {
      throw new NumInvalidParameterException('numId cannot be null or empty');
    }

    this.moduleId = moduleId;
    this.numId = numId;

    // Create a suitable LookupGenerator based on the type of the record specifier
    const lookupGenerator = this.numId.includes('@')
      ? new EmailLookupGenerator(numId)
      : numId.startsWith('http')
      ? new UrlLookupGenerator(numId)
      : new DomainLookupGenerator(numId);

    this.independentRecordLocation = lookupGenerator.getIndependentLocation(moduleId);
    this.rootIndependentRecordLocation = lookupGenerator.getRootIndependentLocation(moduleId);
    this.hostedRecordLocation = lookupGenerator.getHostedLocation(moduleId);
    this.rootHostedRecordLocation = lookupGenerator.getRootHostedLocation(moduleId);
  }

  /**
   * A Zone Distribution Record has been found so we need to update the email lookups accordingly.
   *
   * @param {int} levels     the number of levels to use for zone distribution
   */
  setEmailRecordDistributionLevels(levels: number) {
    if (this.numId.includes('@')) {
      // This only applies to email NUM IDs
      const generator = new EmailLookupGenerator(this.numId);
      this.independentRecordLocation = generator.getDistributedIndependentLocation(this.moduleId, levels);
      this.hostedRecordLocation = generator.getDistributedHostedLocation(this.moduleId, levels);
    } else {
      logger.warn('Attempt to distribute a non-email lookup using a Zone Distribution Record.');
    }
  }

  /**
   * Extract the 'path' portion of the hosted record
   *
   * @return a path of the form '/a/b/c'
   */
  getHostedRecordPath(): string {
    const index = this.hostedRecordLocation.indexOf(this.rootHostedRecordLocation);
    if (index > -1) {
      return ModuleDnsQueries.toPath(this.hostedRecordLocation.substring(0, index));
    }

    throw new NumInvalidDnsQueryException(`Invalid hosted record location: ${this.hostedRecordLocation}`);
  }

  /**
   * Extract the 'path' portion of the independent record
   *
   * @return a path of the form '/a/b/c'
   */
  getIndependentRecordPath(): string {
    const index = this.independentRecordLocation.indexOf(this.rootIndependentRecordLocation);
    if (index > -1) {
      return ModuleDnsQueries.toPath(this.independentRecordLocation.substring(0, index));
    }

    throw new NumInvalidDnsQueryException(`Invalid independent record location: ${this.independentRecordLocation}`);
  }

  /**
   * Convert a domain path to a URL path, e.g. `manager.sales` becomes `/sales/manager`
   *
   * @param {String} domainPath a String
   * @return a URL path String
   */
  private static toPath(domainPath: string): string {
    if (domainPath.includes('.')) {
      const parts = domainPath.split('.').reverse();
      return `/${parts.join('/')}`;
    }
    return `/${domainPath}`;
  }

  /**
   * Set the hosted record to the specified path
   *
   * @param {String} path the path String
   */
  redirectHostedPath(path: string): void {
    const newLocation = '/' === path ? this.rootHostedRecordLocation : `${ModuleDnsQueries.fromPath(path)}${'.'}${this.rootHostedRecordLocation}`;
    if (newLocation === this.hostedRecordLocation) {
      throw new NumInvalidRedirectException('Cannot redirect back to the same location.');
    }

    this.hostedRecordLocation = newLocation;
  }

  /**
   * Set the independent record to the specified path
   *
   * @param  {String} path the path String
   */
  redirectIndependentPath(path: string): void {
    const newLocation = '/' === path ? this.rootIndependentRecordLocation : `${ModuleDnsQueries.fromPath(path)}${'.'}${this.rootIndependentRecordLocation}`;
    if (newLocation === this.independentRecordLocation) {
      throw new NumInvalidRedirectException('Cannot redirect back to the same location.');
    }

    this.independentRecordLocation = newLocation;
  }

  /**
   * Convert a URL path to a domain path , e.g. `/sales/manager` becomes `manager.sales`
   *
   * @param {String} path  a String
   * @return a domain path String
   */
  private static fromPath(path: string): string {
    if (path.includes('/')) {
      return path
        .split('/')
        .reverse()
        .filter((i) => i.trim().length > 0)
        .join('.');
    }

    return path;
  }
}
