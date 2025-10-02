import { SerpResult, DailyResult } from '../types/core';
export declare class AioAnalysisService {
    /**
     * SerpResult から AIO 関連の情報を抽出して DailyResult に変換
     * @param serpResult SERP検索結果
     * @param targetDomains 監視対象ドメイン
     * @param keyword 検索キーワード
     * @param runParams その他のパラメータ
     */
    static extractAioInfo(serpResult: SerpResult, targetDomains: string[], keyword: string, runParams: {
        engine: 'google' | 'yahoo';
        device: 'desktop' | 'mobile';
        lang: string;
        location: {
            type: string;
            value: string;
        };
    }): Partial<DailyResult>;
    /**
     * SERP結果から自社ドメインの順位を特定
     * @param serpResult SERP検索結果
     * @param targetDomains 監視対象ドメイン
     */
    static findOwnRank(serpResult: SerpResult, targetDomains: string[]): number | undefined;
    /**
     * 自社ドメインの参照チェック
     */
    private static checkOwnDomainCitations;
    /**
     * ドメインの正規化
     */
    private static normalizeDomain;
    /**
     * 変動の検出（前回結果との比較）
     * TODO: 前回結果との比較ロジックを実装
     */
    static detectChanges(currentResult: DailyResult, previousResult?: DailyResult): {
        aio_status_changed: boolean;
        citation_status_changed: boolean;
        rank_changed: boolean;
        rank_change_amount?: number;
    };
}
//# sourceMappingURL=aio.d.ts.map