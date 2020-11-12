export interface ModlServices {
    interpretNumRecord(modl: string, timeout: number): Promise<string>;
}
export declare function createModlServices(): ModlServices;
export declare function checkForRedirection(obj: any): void;
