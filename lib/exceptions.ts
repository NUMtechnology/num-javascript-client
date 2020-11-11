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
  }
}

/**
 * Num invalid parameter exception
 */
export class NumInvalidParameterException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Num bad url exception
 */
export class NumBadUrlException extends NumException {
  constructor(msg: string, _cause: Error) {
    super(msg);
  }
}

/**
 * Num invalid dns query exception
 */
export class NumInvalidDnsQueryException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Num not implemented exception
 */
export class NumNotImplementedException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Num invalid redirect exception
 */
export class NumInvalidRedirectException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Bad dns status exception
 */
export class BadDnsStatusException extends NumException {
  constructor(readonly status: number, msg: string) {
    super(msg);
  }
}

/**
 * Invalid dns response exception
 */
export class InvalidDnsResponseException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Rr set header format exception
 */
export class RrSetHeaderFormatException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Rr set incomplete exception
 */
export class RrSetIncompleteException extends NumException {
  constructor(msg: string) {
    super(msg);
  }
}

/**
 * Num maximum redirects exceeded exception
 */
export class NumMaximumRedirectsExceededException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Relative path exception
 */
export class RelativePathException extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}

/**
 * Num lookup redirect
 */
export class NumLookupRedirect extends NumException {
  constructor(msg?: string) {
    super(msg);
  }
}
