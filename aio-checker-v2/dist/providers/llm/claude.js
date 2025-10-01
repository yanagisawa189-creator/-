"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeWebSearchProvider = void 0;
const config_1 = require("../../config");
class ClaudeWebSearchProvider {
    apiKey;
    enabled;
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.enabled = Boolean(apiKey);
        if (!this.enabled) {
            (0, config_1.log)('Claude API key not provided - Claude Web Search will be skipped', 'warn');
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async checkCitations(params) {
        if (!this.enabled) {
            (0, config_1.log)('Claude Web Search is disabled', 'debug');
            return null;
        }
        const { keyword, lang } = params;
        (0, config_1.log)(`Checking Claude Web Search citations for \"${keyword}\" (${lang})`, 'debug');
        try {
            // TODO: Anthropic Claude API with Web Search implementation
            // 現時点ではモック実装
            return this.getMockClaudeResult(keyword, lang);
        }
        catch (error) {
            (0, config_1.log)(`Failed to get Claude Web Search results: ${error}`, 'error');
            return null;
        }
    }
    getMockClaudeResult(keyword, lang) {
        // モックデータ
        const mockCitations = [
            'https://example.com/weather-today',
            'https://weather.com/today-forecast',
            'https://openweathermap.org/current',
        ];
        const mockExcerpt = lang === 'ja'
            ? `${keyword}に関する情報をウェブから取得しました。今日の天気予報は...`
            : `Here's what I found about \"${keyword}\" from web sources. Today's weather forecast shows...`;
        (0, config_1.log)(`Using mock Claude Web Search result for \"${keyword}\"`, 'debug');
        return {
            llm_engine: 'claude',
            citations: mockCitations,
            own_cited: false, // TODO: ターゲットドメインとのマッチング
            excerpt: mockExcerpt,
            answer_present: true,
        };
    }
    // TODO: 実際のClaude API実装
    async callClaudeWebSearch(keyword, lang) {
        if (!this.apiKey) {
            throw new Error('Claude API key is required');
        }
        // TODO: @anthropic-ai/sdk を使用してWeb Searchを有効化したクエリを実行
        // 1. Claude APIクライアントの初期化
        // 2. Web Search toolを有効化
        // 3. キーワードに関する質問を送信
        // 4. レスポンスから引用URLを抽出
        // 5. LlmCitationResult形式で返却
        throw new Error('Claude Web Search API implementation pending');
    }
    /**
     * ターゲットドメインとの照合
     */
    checkTargetDomainMatch(citations, targetDomains) {
        if (targetDomains.length === 0) {
            return false;
        }
        return citations.some(citation => {
            const domain = this.normalizeDomain(citation);
            return targetDomains.some(target => {
                const normalizedTarget = this.normalizeDomain(target);
                return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
            });
        });
    }
    normalizeDomain(url) {
        try {
            const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            return parsedUrl.hostname.replace(/^www\./, '');
        }
        catch {
            return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
        }
    }
}
exports.ClaudeWebSearchProvider = ClaudeWebSearchProvider;
//# sourceMappingURL=claude.js.map