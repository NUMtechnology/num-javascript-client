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

import { NumInvalidDnsQueryException, NumInvalidRedirectException } from './exceptions';
import { createDomainLookupGenerator, createEmailLookupGenerator, createUrlLookupGenerator } from './lookupgenerators';
import logger from 'loglevel';
import { NO_USER_INFO, NumUri, PositiveInteger } from './numuri';

/**
 * Module dns queries
 */
export interface ModuleDnsQueries {
  populatorLocation: string | null;
  hostedRecordLocation: string;
  independentRecordLocation: string;
  redirectHostedPath(path: string): void;
  redirectIndependentPath(path: string): void;
  getHostedRecordPath(): string;
  getIndependentRecordPath(): string;
}

/**
 * Creates module dns queries
 * @param moduleId
 * @param numUri
 * @returns
 */
export function createModuleDnsQueries(moduleId: PositiveInteger, numUri: NumUri) {
  return new ModuleDnsQueriesImpl(moduleId, numUri);
}

/**
 * Module dns queries impl
 */
class ModuleDnsQueriesImpl implements ModuleDnsQueries {
  private readonly moduleId: PositiveInteger;
  private readonly numUri: NumUri;
  private _independentRecordLocation: string;
  private readonly _rootIndependentRecordLocation: string;
  private _hostedRecordLocation: string;
  private readonly _rootHostedRecordLocation: string;
  private readonly _populatorLocation: string | null;

  /**
   * Creates an instance of module dns queries.
   * @param moduleId
   * @param numUri
   */
  constructor(moduleId: PositiveInteger, numUri: NumUri) {
    this.moduleId = moduleId;
    this.numUri = numUri;

    // Create a suitable LookupGenerator based on the type of the record specifier
    const lookupGenerator =
      this.numUri.userinfo !== NO_USER_INFO
        ? createEmailLookupGenerator(this.numUri)
        : this.numUri.protocol.startsWith('http')
        ? createUrlLookupGenerator(this.numUri)
        : createDomainLookupGenerator(this.numUri);

    this._independentRecordLocation = lookupGenerator.getIndependentLocation(this.moduleId);
    this._rootIndependentRecordLocation = lookupGenerator.getRootIndependentLocation(this.moduleId);
    this._hostedRecordLocation = lookupGenerator.getHostedLocation(this.moduleId);
    this._rootHostedRecordLocation = lookupGenerator.getRootHostedLocation(this.moduleId);

    this._populatorLocation = lookupGenerator.isDomainRoot() ? lookupGenerator.getPopulatorLocation(this.moduleId) : null;
  }

  /**
   * Gets populator location
   */
  get populatorLocation(): string | null {
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
  setEmailRecordDistributionLevels(levels: PositiveInteger) {
    if (this.numUri.userinfo !== NO_USER_INFO) {
      // This only applies to email NUM IDs
      const generator = createEmailLookupGenerator(this.numUri);
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
      return toPath(this._hostedRecordLocation.substring(0, index));
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
      return toPath(this._independentRecordLocation.substring(0, index));
    }

    throw new NumInvalidDnsQueryException(`Invalid independent record location: ${this._independentRecordLocation}`);
  }

  /**
   * Set the hosted record to the specified path
   *
   * @param {String} path the path String
   */
  redirectHostedPath(path: string): void {
    const newLocation = '/' === path ? this._rootHostedRecordLocation : `${fromPath(path)}${'.'}${this._rootHostedRecordLocation}`;
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
    const newLocation = '/' === path ? this._rootIndependentRecordLocation : `${fromPath(path)}${'.'}${this._rootIndependentRecordLocation}`;
    if (newLocation === this._independentRecordLocation) {
      throw new NumInvalidRedirectException('Cannot redirect back to the same location.');
    }

    this._independentRecordLocation = newLocation;
  }
}

/**
 * Convert a domain path to a URL path, e.g. `manager.sales` becomes `/sales/manager`
 *
 * @param {String} domainPath a String
 * @return a URL path String
 */
function toPath(domainPath: string): string {
  if (domainPath.includes('.')) {
    return '/' + domainPath.split('.').reverse().join('/');
  }
  return `/${domainPath}`;
}

/**
 * Convert a URL path to a domain path , e.g. `/sales/manager` becomes `manager.sales`
 *
 * @param {String} path  a String
 * @return a domain path String
 */
function fromPath(path: string): string {
  if (path.includes('/')) {
    return path
      .split('/')
      .reverse()
      .filter((i) => i.trim().length > 0)
      .join('.');
  }

  return path;
}
