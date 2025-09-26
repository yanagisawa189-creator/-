"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AioAnalysisService = void 0;
const config_1 = require("../config");
class AioAnalysisService {
    /**
     * SerpResult から AIO 関連の情報を抽出して DailyResult に変換
     * @param serpResult SERP検索結果
     * @param targetDomains 監視対象ドメイン
     * @param keyword 検索キーワード
     * @param runParams その他のパラメータ
     */
    static extractAioInfo(serpResult, targetDomains, keyword, runParams) {
        const { aio } = serpResult;
        (0, config_1.log)(`Extracting AIO info for \"${keyword}\" - AIO present: ${aio?.present || false}`, 'debug');
        if (!aio || !aio.present) {
            return {
                aio_present: false,
                aio_sources: [],
                own_cited: false,
                own_cited_urls: [],
            };
        }
        // AIO ソースURLの抽出
        const aio_sources = aio.sources.map(source => source.url);
        // 自社ドメインの参照チェック
        const { own_cited, own_cited_urls } = this.checkOwnDomainCitations(aio.sources, targetDomains);
        (0, config_1.log)(`AIO analysis: ${aio_sources.length} sources, own_cited: ${own_cited}`, 'debug');
        return {
            aio_present: true,
            aio_sources,
            own_cited,
            own_cited_urls,
        };
    }
    /**
     * SERP結果から自社ドメインの順位を特定
     * @param serpResult SERP検索結果
     * @param targetDomains 監視対象ドメイン
     */
    static findOwnRank(serpResult, targetDomains) {
        if (targetDomains.length === 0 || !serpResult.organic.length) {
            return undefined;
        }
        const ownResult = serpResult.organic.find(result => {
            const domain = this.normalizeDomain(result.url);
            return targetDomains.some(target => {
                const normalizedTarget = this.normalizeDomain(target);
                return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
            });
        });
        const rank = ownResult?.rank;
        if (rank) {
            (0, config_1.log)(`Own domain found at rank ${rank}`, 'debug');
        }
        return rank;
    }
    /**
     * 自社ドメインの参照チェック
     */
    static checkOwnDomainCitations(sources, targetDomains) {
        if (targetDomains.length === 0) {
            return { own_cited: false, own_cited_urls: [] };
        }
        const own_cited_urls = sources
            .filter(source => {
            const domain = this.normalizeDomain(source.url);
            return targetDomains.some(target => {
                const normalizedTarget = this.normalizeDomain(target);
                return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
            });
        })
            .map(source => source.url);
        return {
            own_cited: own_cited_urls.length > 0,
            own_cited_urls,
        };
    }
    /**
     * ドメインの正規化
     */
    static normalizeDomain(url) {
        try {
            const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            return parsedUrl.hostname.replace(/^www\./, '');
        }
        catch {
            return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
        }
    }
    /**
     * 変動の検出（前回結果との比較）
     * TODO: 前回結果との比較ロジックを実装
     */
    static detectChanges(currentResult, previousResult) {
        if (!previousResult) {
            return {
                aio_status_changed: false,
                citation_status_changed: false,
                rank_changed: false,
            };
        }
        const aio_status_changed = currentResult.aio_present !== previousResult.aio_present;
        const citation_status_changed = currentResult.own_cited !== previousResult.own_cited;
        const currentRank = currentResult.serp_rank;
        const previousRank = previousResult.serp_rank;
        const rank_changed = currentRank !== previousRank;
        const rank_change_amount = (currentRank && previousRank) ? currentRank - previousRank : undefined;
        if (aio_status_changed || citation_status_changed || rank_changed) {
            (0, config_1.log)(`Changes detected - AIO: ${aio_status_changed}, Citation: ${citation_status_changed}, Rank: ${rank_changed}`, 'info');
        }
        return {
            aio_status_changed,
            citation_status_changed,
            rank_changed,
            rank_change_amount,
        };
    }
}
exports.AioAnalysisService = AioAnalysisService;
//# sourceMappingURL=aio.js.map