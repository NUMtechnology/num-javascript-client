export declare class DoHResolver {
    readonly name: string;
    readonly url: string;
    constructor(name: string, url: string);
}
export declare class Question {
    readonly name: string;
    readonly type: number | string;
    readonly dnssec: boolean;
    constructor(name: string, type: number | string, dnssec: boolean);
}
export interface DnsClient {
    query(question: Question): Promise<string[]>;
}
export declare function createDnsClient(resolver?: DoHResolver): DnsClient;
