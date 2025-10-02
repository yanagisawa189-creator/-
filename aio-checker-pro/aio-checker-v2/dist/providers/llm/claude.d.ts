import { LlmCitationResult } from '../../types/core';
export declare class ClaudeWebSearchProvider {
    private apiKey?;
    private enabled;
    constructor(apiKey?: string);
    isEnabled(): boolean;
    checkCitations(params: {
        keyword: string;
        lang: string;
    }): Promise<LlmCitationResult | null>;
    private getMockClaudeResult;
    private callClaudeWebSearch;
    /**
     * ターゲットドメインとの照合
     */
    checkTargetDomainMatch(citations: string[], targetDomains: string[]): boolean;
    private normalizeDomain;
}
//# sourceMappingURL=claude.d.ts.map