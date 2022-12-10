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

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Num exception
 */
export class NumException extends Error {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumException.prototype);
  }
}

/**
 * Num invalid parameter exception
 */
export class NumInvalidParameterException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumInvalidParameterException.prototype);
  }
}

/**
 * Num bad url exception
 */
export class NumBadUrlException extends NumException {
  readonly cause: Error;

  constructor(msg: string, cause: Error) {
    super(msg);
    this.cause = cause;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumBadUrlException.prototype);
  }
}

/**
 * Num invalid dns query exception
 */
export class NumInvalidDnsQueryException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumInvalidDnsQueryException.prototype);
  }
}

/**
 * Num not implemented exception
 */
export class NumNotImplementedException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumNotImplementedException.prototype);
  }
}

/**
 * Num invalid redirect exception
 */
export class NumInvalidRedirectException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumInvalidRedirectException.prototype);
  }
}

/**
 * Bad dns status exception
 */
export class BadDnsStatusException extends NumException {
  constructor(readonly status: number, msg: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BadDnsStatusException.prototype);
  }
}

/**
 * Invalid dns response exception
 */
export class InvalidDnsResponseException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidDnsResponseException.prototype);
  }
}

/**
 * Rr set header format exception
 */
export class RrSetHeaderFormatException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RrSetHeaderFormatException.prototype);
  }
}

/**
 * Rr set incomplete exception
 */
export class RrSetIncompleteException extends NumException {
  constructor(msg: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RrSetIncompleteException.prototype);
  }
}

/**
 * Num maximum redirects exceeded exception
 */
export class NumMaximumRedirectsExceededException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumMaximumRedirectsExceededException.prototype);
  }
}

/**
 * Relative path exception
 */
export class RelativePathException extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RelativePathException.prototype);
  }
}

/**
 * Num lookup redirect
 */
export class NumLookupRedirect extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumLookupRedirect.prototype);
  }
}

/**
 * Num lookup no data
 */
export class NumLookupEmptyResult extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumLookupEmptyResult.prototype);
  }
}

/**
 * Num lookup DoH error
 */
export class NumLookupBadDoHResponse extends NumException {
  constructor(msg?: string) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumLookupBadDoHResponse.prototype);
  }
}

/**
 * Used to report errors in the NUM protocol
 */

export enum NumProtocolErrorCode {
  errorCreatingContext = 'ERROR_CREATING_CONTEXT',
  substitutionsFileNotFoundError = 'SUBSTITUTIONS_FILE_NOT_FOUND',
  noUnpackerConfigFileFound = 'UNPACKER_CONFIG_FILE_NOT_FOUND',
  moduleConfigFileNotFound = 'MODULE_CONFIG_FILE_NOT_FOUND',
  tooManyRedirects = 'TOO_MANY_REDIRECTS',
  internalError = 'INTERNAL_ERROR',
  noModlRecordFound = 'NUM_RECORD_NOT_FOUND',
  badDoHResponse = 'DOH_SERVICE_ERROR',
}

/**
 * Error reporting.
 */
export class NumProtocolException extends NumException {
  constructor(readonly errorCode: NumProtocolErrorCode, message: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NumProtocolException.prototype);
  }
}
