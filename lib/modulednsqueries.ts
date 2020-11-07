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
import { DomainLookupGenerator, EmailLookupGenerator, UrlLookupGenerator } from './lookupgenerators';
import logger from 'loglevel';

/**
 * Module dns queries
 */
export class ModuleDnsQueries {
  private readonly moduleId: number;
  private readonly numId: string;
  private _independentRecordLocation: string;
  private readonly _rootIndependentRecordLocation: string;
  private _hostedRecordLocation: string;
  private readonly _rootHostedRecordLocation: string;
  private readonly _populatorLocation: string | null;

  /**
   * Creates an instance of module dns queries.
   * @param moduleId
   * @param numId
   */
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

    this._independentRecordLocation = lookupGenerator.getIndependentLocation(moduleId);
    this._rootIndependentRecordLocation = lookupGenerator.getRootIndependentLocation(moduleId);
    this._hostedRecordLocation = lookupGenerator.getHostedLocation(moduleId);
    this._rootHostedRecordLocation = lookupGenerator.getRootHostedLocation(moduleId);

    this._populatorLocation = lookupGenerator.isDomainRoot() ? lookupGenerator.getPopulatorLocation(moduleId) : null;
  }

  /**
   * Gets populator location
   */
  get populatorLocation() {
    return this._populatorLocation;
  }

  /**
   * Gets independent record location
   */
  get independentRecordLocation() {
    return this._independentRecordLocation;
  }

  /**
   * Gets hosted record location
   */
  get hostedRecordLocation() {
    return this._hostedRecordLocation;
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
      this._independentRecordLocation = generator.getDistributedIndependentLocation(this.moduleId, levels);
      this._hostedRecordLocation = generator.getDistributedHostedLocation(this.moduleId, levels);
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
    const index = this._hostedRecordLocation.indexOf(this._rootHostedRecordLocation);
    if (index > -1) {
      return ModuleDnsQueries.toPath(this._hostedRecordLocation.substring(0, index));
    }

    throw new NumInvalidDnsQueryException(`Invalid hosted record location: ${this._hostedRecordLocation}`);
  }

  /**
   * Extract the 'path' portion of the independent record
   *
   * @return a path of the form '/a/b/c'
   */
  getIndependentRecordPath(): string {
    const index = this._independentRecordLocation.indexOf(this._rootIndependentRecordLocation);
    if (index > -1) {
      return ModuleDnsQueries.toPath(this._independentRecordLocation.substring(0, index));
    }

    throw new NumInvalidDnsQueryException(`Invalid independent record location: ${this._independentRecordLocation}`);
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
    const newLocation = '/' === path ? this._rootHostedRecordLocation : `${ModuleDnsQueries.fromPath(path)}${'.'}${this._rootHostedRecordLocation}`;
    if (newLocation === this._hostedRecordLocation) {
      throw new NumInvalidRedirectException('Cannot redirect back to the same location.');
    }

    this._hostedRecordLocation = newLocation;
  }

  /**
   * Set the independent record to the specified path
   *
   * @param  {String} path the path String
   */
  redirectIndependentPath(path: string): void {
    const newLocation = '/' === path ? this._rootIndependentRecordLocation : `${ModuleDnsQueries.fromPath(path)}${'.'}${this._rootIndependentRecordLocation}`;
    if (newLocation === this._independentRecordLocation) {
      throw new NumInvalidRedirectException('Cannot redirect back to the same location.');
    }

    this._independentRecordLocation = newLocation;
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
