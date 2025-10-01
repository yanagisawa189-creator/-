import { log } from '../../config';
import { LlmCitationResult } from '../../types/core';

export class ClaudeWebSearchProvider {
  private apiKey?: string;
  private enabled: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.enabled = Boolean(apiKey);

    if (!this.enabled) {
      log('Claude API key not provided - Claude Web Search will be skipped', 'warn');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async checkCitations(params: { keyword: string; lang: string }): Promise<LlmCitationResult | null> {
    if (!this.enabled) {
      log('Claude Web Search is disabled', 'debug');
      return null;
    }

    const { keyword, lang } = params;

    log(`Checking Claude Web Search citations for \"${keyword}\" (${lang})`, 'debug');

    try {
      // TODO: Anthropic Claude API with Web Search implementation
      // 現時点ではモック実装
      return this.getMockClaudeResult(keyword, lang);

    } catch (error) {
      log(`Failed to get Claude Web Search results: ${error}`, 'error');
      return null;
    }
  }

  private getMockClaudeResult(keyword: string, lang: string): LlmCitationResult {
    // モックデータ
    const mockCitations = [
      'https://example.com/weather-today',
      'https://weather.com/today-forecast',
      'https://openweathermap.org/current',
    ];

    const mockExcerpt = lang === 'ja'
      ? `${keyword}に関する情報をウェブから取得しました。今日の天気予報は...`
      : `Here's what I found about \"${keyword}\" from web sources. Today's weather forecast shows...`;

    log(`Using mock Claude Web Search result for \"${keyword}\"`, 'debug');

    return {
      llm_engine: 'claude',
      citations: mockCitations,
      own_cited: false, // TODO: ターゲットドメインとのマッチング
      excerpt: mockExcerpt,
      answer_present: true,
    };
  }

  // TODO: 実際のClaude API実装
  private async callClaudeWebSearch(keyword: string, lang: string): Promise<LlmCitationResult> {
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
  checkTargetDomainMatch(citations: string[], targetDomains: string[]): boolean {
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

  private normalizeDomain(url: string): string {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
    }
  }
}