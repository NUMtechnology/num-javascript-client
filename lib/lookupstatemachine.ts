import { Location } from './context';
import delay from 'delay';

/**
 * Lookup location state machine state
 */
enum LookupState {
  INDY1,
  INDY2,
  HOSTED1,
  HOSTED2,
  POP0,
  POP1,
  POP2,
  POP3,
  POP4,
  POP5,
  POP6,
  POP7,
  POP8,
  POP9,
  ERROR,
  SUCCESS,
}

/**
 * Lookup location state machine
 */
export interface LookupLocationStateMachine {
  complete(): boolean;
  step(result: boolean | number): Promise<Location>;
}

/**
 * Creates lookup location state machine
 * @returns lookup location state machine
 */
export function createLookupLocationStateMachine(delays?: number[]): LookupLocationStateMachine {
  return new LookupLocationStateMachineImpl(delays);
}

const DEFAULT_DELAYS = [2000, 2000, 2000, 2000, 5000, 5000, 5000, 5000, 5000];

/**
 * Lookup location state machine impl
 */
class LookupLocationStateMachineImpl implements LookupLocationStateMachine {
  private state: LookupState;
  private delays: number[];
  /**
   * Creates an instance of lookup location state machine.
   * @param delays An array of up to 9 delay values in milliseconds to override DEFAULT_DELAYS
   */
  constructor(delays?: number[]) {
    this.state = LookupState.INDY1;
    this.delays = delays ? DEFAULT_DELAYS.map((n, i) => (i < delays.length ? delays[i] : n)) : DEFAULT_DELAYS;
  }

  /**
   * Completes lookup location state machine
   * @returns true if complete
   */
  complete(): boolean {
    return this.state === LookupState.SUCCESS || this.state === LookupState.ERROR;
  }

  /**
   * Steps lookup location state machine
   * @param f
   * @param ctx
   */
  async step(result: boolean | number): Promise<Location> {
    return typeof result === 'boolean' && result === true ? this.success() : await this.fail(result);
  }

  /**
   * Success lookup location state machine
   */
  private success(): Location {
    let result: Location;
    switch (this.state) {
      case LookupState.INDY1:
      case LookupState.INDY2:
        result = Location.INDEPENDENT;
        break;
      case LookupState.HOSTED1:
      case LookupState.HOSTED2:
        result = Location.HOSTED;
        break;
      case LookupState.ERROR:
        result = Location.NONE;
        break;
      default:
        result = Location.POPULATOR;
    }
    this.state = LookupState.SUCCESS;

    return result;
  }

  /**
   * Fails lookup location state machines
   * @param result
   * @param ctx
   */
  private async fail(result: number | false): Promise<Location> {
    switch (this.state) {
      case LookupState.INDY1:
        this.state = LookupState.HOSTED1;
        return Location.HOSTED;
      case LookupState.HOSTED1:
        this.state = LookupState.POP0;
        return Location.POPULATOR;
      case LookupState.POP0:
        await this.checkStatus(result);
        return Location.POPULATOR;
      case LookupState.POP1:
        this.state = LookupState.POP2;
        await delay(this.delays[0]);
        return Location.POPULATOR;
      case LookupState.POP2:
        this.state = LookupState.POP3;
        await delay(this.delays[1]);
        return Location.POPULATOR;
      case LookupState.POP3:
        this.state = LookupState.POP4;
        await delay(this.delays[2]);
        return Location.POPULATOR;
      case LookupState.POP4:
        this.state = LookupState.POP5;
        await delay(this.delays[4]);
        return Location.POPULATOR;
      case LookupState.POP5:
        this.state = LookupState.POP6;
        await delay(this.delays[5]);
        return Location.POPULATOR;
      case LookupState.POP6:
        this.state = LookupState.POP7;
        await delay(this.delays[6]);
        return Location.POPULATOR;
      case LookupState.POP7:
        this.state = LookupState.POP8;
        await delay(this.delays[7]);
        return Location.POPULATOR;
      case LookupState.POP8:
        this.state = LookupState.POP9;
        await delay(this.delays[8]);
        return Location.POPULATOR;
      case LookupState.SUCCESS:
        break;
      case LookupState.POP9:
      case LookupState.INDY2:
      case LookupState.HOSTED2:
      case LookupState.ERROR:
        this.state = LookupState.ERROR;
        return Location.NONE;
      default:
        throw new Error(`Invalid LookupState status: ${this.state}`);
    }
    return Location.NONE;
  }

  /**
   * Checks status
   * @param result
   * @param ctx
   */
  private async checkStatus(result: number | false): Promise<Location> {
    switch (result) {
      case 1:
        this.state = LookupState.POP1;
        await delay(this.delays[3]);
        return Location.POPULATOR;
      case 2:
        this.state = LookupState.INDY2;
        return Location.INDEPENDENT;
      case 3:
        this.state = LookupState.HOSTED2;
        return Location.HOSTED;
      case false:
        this.state = LookupState.ERROR;
        return Location.NONE;
      default:
        throw new Error(`Invalid populator status: ${result}`);
    }
  }
}
