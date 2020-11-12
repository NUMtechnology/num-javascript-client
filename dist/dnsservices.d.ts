import { DnsClient } from './dnsclient';
export interface DnsServices {
    getRecordFromDns(query: string, checkDnsSecValidity: boolean): Promise<string>;
}
export declare function createDnsServices(dnsClient?: DnsClient): DnsServices;
