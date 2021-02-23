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
import delay from 'delay';
import log from 'loglevel';
import { NumLocation } from './context';

//------------------------------------------------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------------------------------------------------
/**
 * Lookup location state machine
 */
export interface LookupLocationStateMachine {
  complete(): boolean;
  step(result: boolean | number): Promise<NumLocation>;
}

/**
 * Creates lookup location state machine
 *
 * @returns lookup location state machine
 */
export const createLookupLocationStateMachine = (delays?: number[]): LookupLocationStateMachine => new LookupLocationStateMachineImpl(delays);

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
  pop0 = 'POP0',
  pop1 = 'POP1',
  pop2 = 'POP2',
  pop3 = 'POP3',
  pop4 = 'POP4',
  pop5 = 'POP5',
  pop6 = 'POP6',
  pop7 = 'POP7',
  pop8 = 'POP8',
  failed = 'ERROR',
  success = 'SUCCESS',
}

const DEFAULT_DELAYS = [2000, 2000, 2000, 2000, 5000, 5000, 5000, 5000];

/**
 * Lookup location state machine impl
 */
class LookupLocationStateMachineImpl implements LookupLocationStateMachine {
  private state: LookupState;
  private delays: number[];
  /**
   * Creates an instance of lookup location state machine.
   *
   * @param delays An array of up to 8 delay values in milliseconds to override DEFAULT_DELAYS
   */
  constructor(delays?: number[]) {
    this.state = LookupState.indy1;
    this.delays = delays ? DEFAULT_DELAYS.map((n, i) => (i < delays.length ? delays[i] : n)) : DEFAULT_DELAYS;
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
  async step(lookupResult: boolean | number): Promise<NumLocation> {
    log.debug('LookupLocationStateMachine - before step: ' + this.state);
    const result = typeof lookupResult === 'boolean' && lookupResult === true ? this.success() : await this.fail(lookupResult);
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
  private async fail(result: number | false): Promise<NumLocation> {
    switch (this.state) {
      case LookupState.indy1:
        this.state = LookupState.hosted1;
        return NumLocation.hosted;
      case LookupState.hosted1:
        this.state = LookupState.pop0;
        return NumLocation.populator;
      case LookupState.pop0:
        await this.checkStatus(result);
        return NumLocation.populator;
      case LookupState.pop1:
        this.state = LookupState.pop2;
        await delay(this.delays[0]);
        return NumLocation.populator;
      case LookupState.pop2:
        this.state = LookupState.pop3;
        await delay(this.delays[1]);
        return NumLocation.populator;
      case LookupState.pop3:
        this.state = LookupState.pop4;
        await delay(this.delays[2]);
        return NumLocation.populator;
      case LookupState.pop4:
        this.state = LookupState.pop5;
        await delay(this.delays[4]);
        return NumLocation.populator;
      case LookupState.pop5:
        this.state = LookupState.pop6;
        await delay(this.delays[5]);
        return NumLocation.populator;
      case LookupState.pop6:
        this.state = LookupState.pop7;
        await delay(this.delays[6]);
        return NumLocation.populator;
      case LookupState.pop7:
        this.state = LookupState.pop8;
        await delay(this.delays[7]);
        return NumLocation.populator;
      case LookupState.success:
        break;
      case LookupState.pop8:
      case LookupState.indy2:
      case LookupState.hosted2:
      case LookupState.failed:
        this.state = LookupState.failed;
        return NumLocation.none;
      default:
        const state: string = this.state;
        throw new Error(`Invalid LookupState status: ${state}`);
    }
    return NumLocation.none;
  }

  /**
   * Checks status
   *
   * @param result
   * @param ctx
   */
  private async checkStatus(result: number | false): Promise<NumLocation> {
    switch (result) {
      case 1:
        this.state = LookupState.pop1;
        await delay(this.delays[3]);
        return NumLocation.populator;
      case 2:
        this.state = LookupState.indy2;
        return NumLocation.independent;
      case 3:
        this.state = LookupState.hosted2;
        return NumLocation.hosted;
      case 4:
      case false:
      default:
        this.state = LookupState.failed;
        return NumLocation.none;
    }
  }
}
