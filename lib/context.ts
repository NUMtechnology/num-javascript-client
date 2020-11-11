import { Hostname, NumUri, parseNumUri } from './numuri';
import { createModuleDnsQueries, ModuleDnsQueries } from './modulednsqueries';
import log from 'loglevel';
import { NumInvalidRedirectException, NumMaximumRedirectsExceededException } from './exceptions';
import { resolvePath } from './urlrelativepathresolver';

const MAX_NUM_REDIRECTS = 3;

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Location
 */
export enum Location {
  HOSTED = 'HOSTED',
  INDEPENDENT = 'INDEPENDENT',
  POPULATOR = 'POPULATOR',
  NONE = 'NONE',
}

/**
 * Context
 */
export class Context {
  public location: Location = Location.INDEPENDENT;
  public result: string | null = null;
  public readonly numAddress: NumUri;
  _queries: ModuleDnsQueries;
  redirectCount: number = 0;
  userVariables: Map<string, string | number | boolean>;
  /**
   * Dnssec is checked if this is `true` - NOT YET IMPLEMENTED
   */
  dnssec: boolean = false;

  /**
   * Creates an instance of context.
   * @param numAddress
   */
  constructor(numAddress: NumUri) {
    this.numAddress = numAddress;
    this._queries = createModuleDnsQueries(numAddress.port, numAddress);
    this.userVariables = new Map<string, string | number | boolean>();
  }

  /**
   * Sets user varaible
   * @param name
   * @param value
   */
  setUserVaraible(name: string, value: string | number | boolean) {
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
  get queries() {
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
    log.info('Query Redirected to: {}', redirect);
    const redirectCount = this.incrementRedirectCount();
    if (redirectCount >= MAX_NUM_REDIRECTS) {
      log.debug('Maximum Redirects Exceeded. (max={})', MAX_NUM_REDIRECTS);
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
      switch (this.location) {
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
