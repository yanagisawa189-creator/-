"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerpProvider = void 0;
// SERP プロバイダの抽象インターフェース
class SerpProvider {
    maxRetries = 3;
    baseDelayMs = 1000;
    /**
     * 指数バックオフによるリトライ処理
     * @param operation 実行する処理
     * @param context エラーメッセージ用のコンテキスト
     */
    async retryWithBackoff(operation, context = 'operation') {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === this.maxRetries) {
                    throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`);
                }
                const delay = this.calculateDelay(attempt);
                console.warn(`${context} attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
                await this.delay(delay);
            }
        }
        throw lastError;
    }
    calculateDelay(attempt) {
        const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, 30000); // 最大30秒
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * ドメインの正規化
     * @param url URL
     * @returns 正規化されたドメイン
     */
    normalizeDomain(url) {
        try {
            const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            return parsedUrl.hostname.replace(/^www\./, '');
        }
        catch {
            return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
        }
    }
    /**
     * ターゲットドメインとのマッチング
     * @param url URL
     * @param targetDomains ターゲットドメインリスト
     * @returns マッチするかどうか
     */
    isDomainMatch(url, targetDomains) {
        const domain = this.normalizeDomain(url);
        return targetDomains.some(target => {
            const normalizedTarget = this.normalizeDomain(target);
            return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
        });
    }
}
exports.SerpProvider = SerpProvider;
//# sourceMappingURL=provider.js.map