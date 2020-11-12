import { NumUri, PositiveInteger } from './numuri';
export interface LookupGenerator {
    getRootIndependentLocationNoModuleNumber(arg0: boolean): string;
    getRootHostedLocationNoModuleNumber(arg0: boolean): string;
    getIndependentLocation(moduleId: PositiveInteger): string;
    getHostedLocation(moduleId: PositiveInteger): string;
    isDomainRoot(): boolean;
    getPopulatorLocation(moduleId: PositiveInteger): string | null;
    getRootIndependentLocation(moduleId: PositiveInteger): string;
    getRootHostedLocation(moduleId: PositiveInteger): string;
}
export interface EmailLookupGenerator extends LookupGenerator {
    getDistributedHostedLocation(moduleId: PositiveInteger, levels: PositiveInteger): string;
    getDistributedIndependentLocation(moduleId: PositiveInteger, levels: PositiveInteger): string;
}
export declare function createDomainLookupGenerator(numUri: NumUri): LookupGenerator;
export declare function createEmailLookupGenerator(numUri: NumUri): EmailLookupGenerator;
export declare function createUrlLookupGenerator(numUri: NumUri): LookupGenerator;
