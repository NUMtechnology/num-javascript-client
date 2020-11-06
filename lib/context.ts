import { NumUri } from './client';
import { ModuleDnsQueries } from './modulednsqueries';

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

  /**
   * Creates an instance of context.
   * @param numAddress
   */
  constructor(numAddress: NumUri) {
    this._numAddress = numAddress;
    this._queries = new ModuleDnsQueries(numAddress.port.n, numAddress.numId);
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
}
