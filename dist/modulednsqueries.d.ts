import { NumUri, PositiveInteger } from './numuri';
export interface ModuleDnsQueries {
    populatorLocation: string | null;
    hostedRecordLocation: string;
    independentRecordLocation: string;
    redirectHostedPath(path: string): void;
    redirectIndependentPath(path: string): void;
    getHostedRecordPath(): string;
    getIndependentRecordPath(): string;
}
export declare function createModuleDnsQueries(moduleId: PositiveInteger, numUri: NumUri): ModuleDnsQueriesImpl;
declare class ModuleDnsQueriesImpl implements ModuleDnsQueries {
    private readonly moduleId;
    private readonly numUri;
    private _independentRecordLocation;
    private readonly _rootIndependentRecordLocation;
    private _hostedRecordLocation;
    private readonly _rootHostedRecordLocation;
    private readonly _populatorLocation;
    constructor(moduleId: PositiveInteger, numUri: NumUri);
    get populatorLocation(): string | null;
    get independentRecordLocation(): string;
    get hostedRecordLocation(): string;
    setEmailRecordDistributionLevels(levels: PositiveInteger): void;
    getHostedRecordPath(): string;
    getIndependentRecordPath(): string;
    redirectHostedPath(path: string): void;
    redirectIndependentPath(path: string): void;
}
export {};
