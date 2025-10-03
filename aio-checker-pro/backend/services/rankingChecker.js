const fetch = require('node-fetch');

/**
 * 検索順位チェッカー
 * SerpAPIを使用してGoogle検索順位を取得
 */
class RankingChecker {
    constructor() {
        this.serpApiKey = process.env.SERPAPI_KEY;
    }

    /**
     * Google検索順位をチェック
     * @param {string} keyword - 検索キーワード
     * @param {string} targetDomain - 対象ドメイン（例: ai-kenshu.jp）
     * @param {string} location - 検索地域（デフォルト: Japan）
     * @returns {Promise<Object>} 順位情報
     */
    async checkRanking(keyword, targetDomain, location = 'Japan') {
        try {
            if (!this.serpApiKey) {
                throw new Error('SERPAPI_KEY is not configured');
            }

            // SerpAPI検索パラメータ
            const params = new URLSearchParams({
                q: keyword,
                api_key: this.serpApiKey,
                location: location,
                hl: 'ja',
                gl: 'jp',
                num: 100 // 最大100件取得
            });

            const url = `https://serpapi.com/search?${params}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`SerpAPI error: ${response.statusText}`);
            }

            const data = await response.json();

            // オーガニック検索結果から順位を特定
            const organicResults = data.organic_results || [];
            let ranking = null;
            let foundResult = null;

            for (let i = 0; i < organicResults.length; i++) {
                const result = organicResults[i];
                const resultDomain = this.extractDomain(result.link);

                if (resultDomain === targetDomain) {
                    ranking = i + 1; // 順位は1から始まる
                    foundResult = {
                        position: ranking,
                        title: result.title,
                        url: result.link,
                        snippet: result.snippet,
                        displayed_link: result.displayed_link
                    };
                    break;
                }
            }

            // AI Overviews（AI生成の概要）の有無をチェック
            const hasAIOverview = !!(data.answer_box || data.knowledge_graph);
            const aiOverviewContent = data.answer_box ? data.answer_box.answer : null;

            return {
                keyword,
                targetDomain,
                ranking,
                foundResult,
                totalResults: organicResults.length,
                hasAIOverview,
                aiOverviewContent,
                aiOverviewCitesDomain: aiOverviewContent ?
                    this.checkCitation(aiOverviewContent, targetDomain) : false,
                searchDate: new Date().toISOString(),
                rawData: {
                    organicResults: organicResults.slice(0, 10), // 上位10件のみ保存
                    answerBox: data.answer_box,
                    relatedSearches: data.related_searches
                }
            };

        } catch (error) {
            console.error('Ranking check error:', error);
            throw error;
        }
    }

    /**
     * 複数キーワードの順位を一括チェック
     * @param {Array<string>} keywords - キーワードリスト
     * @param {string} targetDomain - 対象ドメイン
     * @returns {Promise<Array>} 順位情報の配列
     */
    async checkMultipleRankings(keywords, targetDomain) {
        const results = [];

        for (const keyword of keywords) {
            try {
                const result = await this.checkRanking(keyword, targetDomain);
                results.push(result);

                // API制限対策: リクエスト間隔を空ける
                await this.sleep(1000);
            } catch (error) {
                console.error(`Failed to check ranking for "${keyword}":`, error);
                results.push({
                    keyword,
                    targetDomain,
                    error: error.message,
                    searchDate: new Date().toISOString()
                });
            }
        }

        return results;
    }

    /**
     * URLからドメインを抽出
     * @param {string} url - URL
     * @returns {string} ドメイン名
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (error) {
            return '';
        }
    }

    /**
     * AI Overviewsのテキスト内でドメインが引用されているかチェック
     * @param {string} text - AI Overviewsのテキスト
     * @param {string} domain - 対象ドメイン
     * @returns {boolean} 引用されているか
     */
    checkCitation(text, domain) {
        if (!text) return false;
        const cleanDomain = domain.replace('www.', '');
        return text.toLowerCase().includes(cleanDomain.toLowerCase());
    }

    /**
     * 待機関数
     * @param {number} ms - ミリ秒
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 順位履歴のトレンド分析
     * @param {Array} historyData - 過去の順位データ
     * @returns {Object} トレンド情報
     */
    analyzeTrend(historyData) {
        if (!historyData || historyData.length < 2) {
            return { trend: 'insufficient_data' };
        }

        const sorted = historyData.sort((a, b) =>
            new Date(a.searchDate) - new Date(b.searchDate)
        );

        const latest = sorted[sorted.length - 1];
        const previous = sorted[sorted.length - 2];

        if (!latest.ranking || !previous.ranking) {
            return { trend: 'no_ranking' };
        }

        const change = previous.ranking - latest.ranking; // 順位が上がると正、下がると負

        return {
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            change: Math.abs(change),
            currentRanking: latest.ranking,
            previousRanking: previous.ranking,
            latestDate: latest.searchDate,
            previousDate: previous.searchDate
        };
    }
}

module.exports = RankingChecker;
