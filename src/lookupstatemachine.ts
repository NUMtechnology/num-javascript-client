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
import { NumLocation } from './context';
import pino from 'pino';

const log = pino();
//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Lookup location state machine
 */
export interface LookupLocationStateMachine {
  complete(): boolean;
  step(result: boolean | number): NumLocation;
}

/**
 * Creates lookup location state machine
 *
 * @returns lookup location state machine
 */
export const createLookupLocationStateMachine = (): LookupLocationStateMachine => new LookupLocationStateMachineImpl();

//------------------------------------------------------------------------------------------------------------------------
// Internals
//------------------------------------------------------------------------------------------------------------------------
/**
 * Lookup location state machine state
 */
// eslint-disable-next-line no-shadow
enum LookupState {
  indy1 = 'INDY1',
  indy2 = 'INDY2',
  hosted1 = 'HOSTED1',
  hosted2 = 'HOSTED2',
  failed = 'ERROR',
  success = 'SUCCESS',
}

/**
 * Lookup location state machine impl
 */
class LookupLocationStateMachineImpl implements LookupLocationStateMachine {
  private state: LookupState;
  /**
   * Creates an instance of lookup location state machine.
   *
   * @param delays An array of up to 8 delay values in milliseconds to override DEFAULT_DELAYS
   */
  constructor() {
    this.state = LookupState.indy1;
  }

  /**
   * Completes lookup location state machine
   *
   * @returns true if complete
   */
  complete(): boolean {
    return this.state === LookupState.success || this.state === LookupState.failed;
  }

  /**
   * Steps lookup location state machine
   *
   * @param f
   * @param ctx
   */
  step(lookupResult: boolean | number): NumLocation {
    log.debug('LookupLocationStateMachine - before step: ' + this.state);
    const result = typeof lookupResult === 'boolean' && lookupResult === true ? this.success() : this.fail();
    log.debug('LookupLocationStateMachine - after step: ' + this.state);
    return result;
  }

  /**
   * Success lookup location state machine
   */
  private success(): NumLocation {
    let result: NumLocation;
    switch (this.state) {
      case LookupState.indy1:
      case LookupState.indy2:
        result = NumLocation.independent;
        break;
      case LookupState.hosted1:
      case LookupState.hosted2:
        result = NumLocation.hosted;
        break;
      case LookupState.failed:
        result = NumLocation.none;
        break;
      default:
        result = NumLocation.populator;
    }
    this.state = LookupState.success;

    return result;
  }

  /**
   * Fails lookup location state machines
   *
   * @param result
   * @param ctx
   */
  private fail(): NumLocation {
    switch (this.state) {
      case LookupState.indy1:
        this.state = LookupState.hosted1;
        return NumLocation.hosted;
      case LookupState.hosted1:
      case LookupState.indy2:
      case LookupState.hosted2:
      case LookupState.failed:
        this.state = LookupState.failed;
        return NumLocation.none;
      default:
        const state: string = this.state;
        throw new Error(`Invalid LookupState status: ${state}`);
    }
  }
}
