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
import { Hostname, NumUri, parseNumUri } from './numuri';
import { createModuleDnsQueries, ModuleDnsQueries } from './modulednsqueries';
import { NumInvalidRedirectException, NumMaximumRedirectsExceededException } from './exceptions';
import { resolvePath } from './urlrelativepathresolver';
import { log } from 'num-easy-log';

const MAX_NUM_REDIRECTS = 3;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
export type UserVariable = string | number | boolean;

/**
 * Location
 */
// eslint-disable-next-line no-shadow
export enum NumLocation {
  hosted = 'HOSTED',
  independent = 'INDEPENDENT',
  populator = 'POPULATOR',
  none = 'NONE',
}

/**
 * Context
 */
export class Context {
  public location = NumLocation.independent;
  public result: string | null = null;
  public readonly numAddress: NumUri;
  public targetExpandedSchemaVersion: string;
  _queries: ModuleDnsQueries;
  redirectCount = 0;
  userVariables: Map<string, UserVariable>;
  /**
   * Dnssec is checked if this is `true` - NOT YET IMPLEMENTED
   */
  dnssec = false;

  /**
   * Creates an instance of context.
   *
   * @param numAddress
   */
  constructor(numAddress: NumUri) {
    this.numAddress = numAddress;
    this._queries = createModuleDnsQueries(numAddress.port, numAddress);
    this.userVariables = new Map<string, UserVariable>();
    this.targetExpandedSchemaVersion = '1';
  }

  /**
   * Change the target expanded schema version.
   *
   * @param v the target version number as a string.
   */
  setTargetExpandedSchemaVersion(v: string): void {
    this.targetExpandedSchemaVersion = v;
  }
  /**
   * Sets user variable
   *
   * @param name
   * @param value
   */
  setUserVariable(name: string, value: UserVariable): void {
    this.userVariables.set(name, value);
  }

  /**
   * Count redirects and return the current number of redirects.
   *
   * @return the current number of redirects
   */
  incrementRedirectCount(): number {
    return ++this.redirectCount;
  }

  /**
   * Gets queries
   */
  get queries(): ModuleDnsQueries {
    return this._queries;
  }

  /**
   * Update the relevant query for the supplied redirect
   *
   * @param redirect the supplied redirect
   * @throws NumMaximumRedirectsExceededException on Error
   * @throws NumInvalidDNSQueryException          on Error
   * @throws NumInvalidRedirectException          on Error
   */
  handleQueryRedirect(redirect: string): void {
    log.info(`Query Redirected to: ${redirect}`);
    const redirectCount = this.incrementRedirectCount();
    if (redirectCount >= MAX_NUM_REDIRECTS) {
      log.debug(`Maximum Redirects Exceeded. (max=${MAX_NUM_REDIRECTS})`);
      throw new NumMaximumRedirectsExceededException();
    }

    if (redirect.includes(':') || Hostname.isValid(redirect)) {
      try {
        const uri = parseNumUri(redirect);
        this._queries = createModuleDnsQueries(uri.port, uri);
      } catch (e) {
        throw new NumInvalidRedirectException((e as Error).message);
      }
    } else {
      switch (this.location) {
        case NumLocation.independent:
          this.handleIndependentQueryRedirect(redirect);
          break;
        case NumLocation.hosted:
          this.handleHostedQueryRedirect(redirect);
          break;
        default:
      }
    }
  }

  /**
   * Update the hosted query for the supplied redirect
   *
   * @param redirectTo the supplied redirect
   * @throws NumInvalidDNSQueryException on error
   * @throws NumInvalidRedirectException on error
   */
  handleHostedQueryRedirect(redirectTo: string): void {
    const hostedRecordPath = this._queries.getHostedRecordPath();
    try {
      this._queries.redirectHostedPath(resolvePath(hostedRecordPath, redirectTo));
    } catch (e) {
      throw new NumInvalidRedirectException(e);
    }
  }

  /**
   * Update the independent query for the supplied redirect
   *
   * @param redirectTo the supplied redirect
   * @throws NumInvalidDNSQueryException on error
   * @throws NumInvalidRedirectException on error
   */
  handleIndependentQueryRedirect(redirectTo: string): void {
    const independentRecordPath = this._queries.getIndependentRecordPath();
    try {
      this._queries.redirectIndependentPath(resolvePath(independentRecordPath, redirectTo));
    } catch (e) {
      throw new NumInvalidRedirectException(e);
    }
  }
}
