import { Context, Location } from './context';
import { DnsClient } from './dnsclient';
import { NumUri } from './numuri';
export declare function createClient(dnsClient?: DnsClient): NumClient;
export interface NumClient {
    createContext(numAddress: NumUri): Context;
    retrieveNumRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;
    retrieveModlRecord(ctx: Context, handler?: CallbackHandler): Promise<string | null>;
}
export interface CallbackHandler {
    setLocation(l: Location): void;
    setResult(r: string): void;
}
export declare function createDefaultCallbackHandler(): CallbackHandler;
