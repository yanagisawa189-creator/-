import { SerpProvider } from './provider';
import { RunParams, SerpResult } from '../../types/core';
export declare class GoogleSerpApiProvider extends SerpProvider {
    private apiKey;
    constructor(apiKey: string);
    getEngine(): 'google';
    getTop100(params: RunParams): Promise<SerpResult>;
    private extractAioData;
    private extractOrganicResults;
    private getCountryCode;
}
//# sourceMappingURL=google-serpapi.d.ts.map