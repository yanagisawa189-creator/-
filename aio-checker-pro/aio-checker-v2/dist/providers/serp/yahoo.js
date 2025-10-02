"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YahooSerpProvider = void 0;
const provider_1 = require("./provider");
const config_1 = require("../../config");
class YahooSerpProvider extends provider_1.SerpProvider {
    apiKey;
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
    }
    getEngine() {
        return 'yahoo';
    }
    async getTop100(params) {
        const { keyword, device } = params;
        (0, config_1.log)(`Fetching Yahoo! SERP for \"${keyword}\" (${device})`, 'debug');
        return this.retryWithBackoff(async () => {
            // 現時点では Yahoo! API 未実装のため、モックデータを返す
            if (!this.apiKey) {
                (0, config_1.log)('Yahoo! API key not provided - using mock data', 'warn');
                return this.getMockYahooResults(keyword, device);
            }
            // TODO: 実際のYahoo! API実装時に差し替え
            return this.getMockYahooResults(keyword, device);
        }, `Yahoo! SERP for \"${keyword}\"`);
    }
    getMockYahooResults(keyword, device) {
        // Yahoo! はAIOを持たないため、常にnull
        const mockOrganicResults = [
            {
                rank: 1,
                domain: 'yahoo.co.jp',
                url: 'https://yahoo.co.jp/search/example1',
                title: `${keyword} - Yahoo!検索結果1`,
            },
            {
                rank: 2,
                domain: 'example.com',
                url: 'https://example.com/page2',
                title: `${keyword} - 検索結果2`,
            },
            {
                rank: 3,
                domain: 'test.jp',
                url: 'https://test.jp/article',
                title: `${keyword} - 検索結果3`,
            },
        ];
        // デバイスに応じてモックデータを微調整
        if (device === 'mobile') {
            mockOrganicResults.forEach(item => {
                item.title += ' (モバイル版)';
            });
        }
        (0, config_1.log)(`Using mock Yahoo! results for \"${keyword}\" (${mockOrganicResults.length} results)`, 'debug');
        return {
            engine: 'yahoo',
            aio: null, // Yahoo! はAIOを持たない
            organic: mockOrganicResults,
            own_rank: undefined,
        };
    }
    // TODO: 実際のYahoo! API実装時に使用
    async fetchYahooResults(params) {
        // DataForSEO Yahoo エンジンまたは他のプロバイダーを使用
        // 現在は未実装
        throw new Error('Yahoo! API integration not yet implemented');
    }
}
exports.YahooSerpProvider = YahooSerpProvider;
//# sourceMappingURL=yahoo.js.map