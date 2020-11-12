import { Location } from './context';
export interface LookupLocationStateMachine {
    complete(): boolean;
    step(result: boolean | number): Promise<Location>;
}
export declare function createLookupLocationStateMachine(delays?: number[]): LookupLocationStateMachine;
