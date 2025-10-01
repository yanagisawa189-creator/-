import { RunParams, SerpResult } from '../../types/core';

// SERP プロバイダの抽象インターフェース
export abstract class SerpProvider {
  protected maxRetries: number = 3;
  protected baseDelayMs: number = 1000;

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
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`);
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`${context} attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // 最大30秒
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ドメインの正規化
   * @param url URL
   * @returns 正規化されたドメイン
   */
  protected normalizeDomain(url: string): string {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
    }
  }

  /**
   * ターゲットドメインとのマッチング
   * @param url URL
   * @param targetDomains ターゲットドメインリスト
   * @returns マッチするかどうか
   */
  protected isDomainMatch(url: string, targetDomains: string[]): boolean {
    const domain = this.normalizeDomain(url);
    return targetDomains.some(target => {
      const normalizedTarget = this.normalizeDomain(target);
      return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
    });
  }
}