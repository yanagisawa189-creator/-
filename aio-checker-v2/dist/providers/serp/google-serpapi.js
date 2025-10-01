"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSerpApiProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const provider_1 = require("./provider");
const config_1 = require("../../config");
class GoogleSerpApiProvider extends provider_1.SerpProvider {
    apiKey;
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
    }
    getEngine() {
        return 'google';
    }
    async getTop100(params) {
        const { keyword, lang, location, device } = params;
        (0, config_1.log)(`Fetching Google SERP for \"${keyword}\" (${device}, ${lang})`, 'debug');
        return this.retryWithBackoff(async () => {
            // SerpAPI の URLパラメータ構築
            const searchParams = new URLSearchParams({
                api_key: this.apiKey,
                engine: 'google',
                q: keyword,
                hl: lang,
                gl: this.getCountryCode(location?.value || 'United States'),
                device: device,
                num: '100', // 100件取得
                start: '0',
            });
            // 地域指定
            if (location && location.type === 'city') {
                searchParams.set('location', location.value);
            }
            const url = `https://serpapi.com/search?${searchParams.toString()}`;
            (0, config_1.log)(`SerpAPI URL: ${url.replace(this.apiKey, '[REDACTED]')}`, 'debug');
            // axios でリクエスト実行（20秒タイムアウト）
            const response = await axios_1.default.get(url, {
                timeout: 20000,
                headers: {
                    'User-Agent': 'AIO-Checker-MVP/0.1.0',
                },
            });
            const data = response.data;
            (0, config_1.log)(`SerpAPI response received: ${JSON.stringify(data).length} characters`, 'debug');
            // AIO の抽出
            const aio = this.extractAioData(data);
            // 自然検索結果の抽出（100件まで）
            const organic = this.extractOrganicResults(data);
            return {
                engine: 'google',
                aio,
                organic,
                own_rank: undefined, // 後でターゲットドメインとマッチング
            };
        }, `Google SERP for \"${keyword}\"`);
    }
    extractAioData(data) {
        // AI Overview の抽出ロジック
        if (data.ai_overview) {
            const sources = (data.ai_overview.sources || []).map((source) => ({
                url: source.link,
                domain: this.normalizeDomain(source.link),
            }));
            return {
                present: true,
                sources,
                text_length: data.ai_overview.text?.length,
                heading_count: undefined, // 見出しカウント（今後実装）
                has_followup_questions: Boolean(data.ai_overview.followup_questions?.length),
            };
        }
        // Answer Box からも抽出を試行
        if (data.answer_box && data.answer_box.sources) {
            const sources = data.answer_box.sources.map((source) => ({
                url: source.link,
                domain: this.normalizeDomain(source.link),
            }));
            return {
                present: true,
                sources,
                text_length: data.answer_box.text?.length,
            };
        }
        return null;
    }
    extractOrganicResults(data) {
        // organic_results から上位100件を抽出
        if (!data.organic_results) {
            return [];
        }
        return data.organic_results
            .slice(0, 100)
            .map((result) => ({
            rank: result.position,
            domain: result.domain || this.normalizeDomain(result.link),
            url: result.link,
            title: result.title,
        }));
    }
    getCountryCode(locationValue) {
        // 地域名から国コードへのマッピング
        const mapping = {
            'Japan': 'jp',
            'United States': 'us',
            'United Kingdom': 'gb',
            'Germany': 'de',
            'France': 'fr',
            'Tokyo': 'jp',
        };
        return mapping[locationValue] || 'us';
    }
}
exports.GoogleSerpApiProvider = GoogleSerpApiProvider;
//# sourceMappingURL=google-serpapi.js.map