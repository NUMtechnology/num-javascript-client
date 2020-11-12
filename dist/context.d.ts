import { NumUri } from './numuri';
import { ModuleDnsQueries } from './modulednsqueries';
export declare type UserVariable = string | number | boolean;
export declare enum Location {
    HOSTED = "HOSTED",
    INDEPENDENT = "INDEPENDENT",
    POPULATOR = "POPULATOR",
    NONE = "NONE"
}
export declare class Context {
    location: Location;
    result: string | null;
    readonly numAddress: NumUri;
    _queries: ModuleDnsQueries;
    redirectCount: number;
    userVariables: Map<string, UserVariable>;
    dnssec: boolean;
    constructor(numAddress: NumUri);
    setUserVariable(name: string, value: UserVariable): void;
    incrementRedirectCount(): number;
    get queries(): ModuleDnsQueries;
    handleQueryRedirect(redirect: string): void;
    handleHostedQueryRedirect(redirectTo: string): void;
    handleIndependentQueryRedirect(redirectTo: string): void;
}
