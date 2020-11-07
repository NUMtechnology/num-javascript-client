import { Context, Location } from './context';
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

  step(f: () => true | number, ctx: Context): void;
}

export function createLookupLocationStateMachine(): LookupLocationStateMachine {
  return new LookupLocationStateMachineImpl();
}

class LookupLocationStateMachineImpl implements LookupLocationStateMachine {
  private state: LookupState;

  /**
   * Creates an instance of lookup location state machine.
   */
  constructor() {
    this.state = LookupState.INDY1;
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
  step(f: () => true | number, ctx: Context): void {
    // f is a function supplied by the caller and its result controls the state machine.
    const result = f();
    typeof result === 'boolean' ? this.success() : this.fail(result, ctx);
  }

  /**
   * Success lookup location state machine
   */
  private success() {
    this.state = LookupState.SUCCESS;
  }

  /**
   * Fails lookup location state machines
   * @param result
   * @param ctx
   */
  private async fail(result: number, ctx: Context) {
    switch (this.state) {
      case LookupState.INDY1:
        this.state = LookupState.HOSTED1;
        ctx.location = Location.HOSTED;
        break;
      case LookupState.HOSTED1:
        this.state = LookupState.POP0;
        ctx.location = Location.POPULATOR;
        break;
      case LookupState.POP0:
        await this.checkStatus(result, ctx);
        ctx.location = Location.POPULATOR;
        break;
      case LookupState.POP1:
        this.state = LookupState.POP2;
        ctx.location = Location.POPULATOR;
        await delay(2000);
        break;
      case LookupState.POP2:
        this.state = LookupState.POP3;
        ctx.location = Location.POPULATOR;
        await delay(2000);
        break;
      case LookupState.POP3:
        this.state = LookupState.POP4;
        ctx.location = Location.POPULATOR;
        await delay(2000);
        break;
      case LookupState.POP4:
        this.state = LookupState.POP5;
        ctx.location = Location.POPULATOR;
        await delay(5000);
        break;
      case LookupState.POP5:
        this.state = LookupState.POP6;
        ctx.location = Location.POPULATOR;
        await delay(5000);
        break;
      case LookupState.POP6:
        this.state = LookupState.POP7;
        ctx.location = Location.POPULATOR;
        await delay(5000);
        break;
      case LookupState.POP7:
        this.state = LookupState.POP8;
        ctx.location = Location.POPULATOR;
        await delay(5000);
        break;
      case LookupState.POP8:
        this.state = LookupState.POP9;
        ctx.location = Location.POPULATOR;
        await delay(5000);
        break;
      case LookupState.SUCCESS:
        break;
      case LookupState.POP9:
      case LookupState.INDY2:
      case LookupState.HOSTED2:
      case LookupState.ERROR:
        this.state = LookupState.ERROR;
        ctx.location = Location.NONE;
        break;
      default:
        throw new Error(`Invalid LookupState status: ${this.state}`);
    }
  }

  /**
   * Checks status
   * @param result
   * @param ctx
   */
  private async checkStatus(result: number, ctx: Context) {
    switch (result) {
      case 1:
        this.state = LookupState.POP1;
        ctx.location = Location.POPULATOR;
        await delay(2000);
        break;
      case 2:
        this.state = LookupState.INDY2;
        ctx.location = Location.INDEPENDENT;
        break;
      case 3:
        this.state = LookupState.HOSTED2;
        ctx.location = Location.HOSTED;
        break;
      default:
        throw new Error(`Invalid populator status: ${result}`);
    }
  }
}
