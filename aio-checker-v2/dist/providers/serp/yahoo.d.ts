import { SerpProvider } from './provider';
import { RunParams, SerpResult } from '../../types/core';
export declare class YahooSerpProvider extends SerpProvider {
    private apiKey?;
    constructor(apiKey?: string);
    getEngine(): 'yahoo';
    getTop100(params: RunParams): Promise<SerpResult>;
    private getMockYahooResults;
    private fetchYahooResults;
}
//# sourceMappingURL=yahoo.d.ts.map