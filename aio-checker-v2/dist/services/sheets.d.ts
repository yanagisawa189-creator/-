import { KeywordConfig, DailyResult } from '../types/core';
export declare class SheetsService {
    private sheets;
    private spreadsheetId;
    constructor(spreadsheetId: string, clientEmail?: string, privateKey?: string);
    readKeywordConfigs(): Promise<KeywordConfig[]>;
    writeResults(results: DailyResult[]): Promise<void>;
    ensureHeaders(): Promise<void>;
}
//# sourceMappingURL=sheets.d.ts.map