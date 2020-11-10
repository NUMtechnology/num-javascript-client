import { Hostname, NumUri, parseNumUri } from './numuri';
import { createModuleDnsQueries, ModuleDnsQueries } from './modulednsqueries';
import log from 'loglevel';
import { NumInvalidRedirectException, NumMaximumRedirectsExceededException } from './exceptions';
import { resolvePath } from './urlrelativepathresolver';

const MAX_NUM_REDIRECTS = 3;
/**
 * Location
 */
export enum Location {
  HOSTED,
  INDEPENDENT,
  POPULATOR,
  NONE,
}

/**
 * Context
 */
export class Context {
  _location: Location = Location.INDEPENDENT;
  _result: string | null = null;
  _numAddress: NumUri;
  _queries: ModuleDnsQueries;
  redirectCount: number = 0;

  /**
   * Creates an instance of context.
   * @param numAddress
   */
  constructor(numAddress: NumUri) {
    this._numAddress = numAddress;
    this._queries = createModuleDnsQueries(numAddress.port, numAddress);
  }

  /**
   * Gets location
   */
  get location() {
    return this._location;
  }

  /**
   * Sets location
   */
  set location(l: Location) {
    this._location = l;
  }

  /**
   * Gets result
   */
  get result(): string | null {
    return this._result;
  }

  /**
   * Sets result
   */
  set result(r: string | null) {
    this._result = r;
  }

  /**
   * Gets num address
   */
  get numAddress(): NumUri {
    return this._numAddress;
  }

  /**
   * Sets num address
   */
  set numAddress(a: NumUri) {
    this._numAddress = a;
  }

  /**
   * Gets queries
   */
  get queries(): ModuleDnsQueries {
    return this._queries;
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
   * Update the relevant query for the supplied redirect
   *
   * @param redirect the supplied redirect
   * @throws NumMaximumRedirectsExceededException on Error
   * @throws NumInvalidDNSQueryException          on Error
   * @throws NumInvalidRedirectException          on Error
   */
  handleQueryRedirect(redirect: string): void {
    log.info('Query Redirected to: {}', redirect);
    const redirectCount = this.incrementRedirectCount();
    if (redirectCount >= MAX_NUM_REDIRECTS) {
      log.error('Maximum Redirects Exceeded. (max={})', MAX_NUM_REDIRECTS);
      throw new NumMaximumRedirectsExceededException();
    }

    if (redirect.includes(':') || Hostname.isValid(redirect)) {
      try {
        const uri = parseNumUri(redirect);
        this._queries = createModuleDnsQueries(uri.port, uri);
      } catch (e) {
        throw new NumInvalidRedirectException(e.message);
      }
    } else {
      switch (this._location) {
        case Location.INDEPENDENT:
          this.handleIndependentQueryRedirect(redirect);
          break;
        case Location.HOSTED:
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
