import { RunParams, SerpResult } from '../../types/core';
export declare abstract class SerpProvider {
    protected maxRetries: number;
    protected baseDelayMs: number;
    abstract getEngine(): 'google' | 'yahoo';
    /**
     * 検索結果（上位100件）とAIO情報を取得
     * @param params 検索パラメータ
     * @returns 検索結果
     */
    abstract getTop100(params: RunParams): Promise<SerpResult>;
    /**
     * 指数バックオフによるリトライ処理
     * @param operation 実行する処理
     * @param context エラーメッセージ用のコンテキスト
     */
    protected retryWithBackoff<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    private calculateDelay;
    private delay;
    /**
     * ドメインの正規化
     * @param url URL
     * @returns 正規化されたドメイン
     */
    protected normalizeDomain(url: string): string;
    /**
     * ターゲットドメインとのマッチング
     * @param url URL
     * @param targetDomains ターゲットドメインリスト
     * @returns マッチするかどうか
     */
    protected isDomainMatch(url: string, targetDomains: string[]): boolean;
}
//# sourceMappingURL=provider.d.ts.map