import { log } from '../../config.js';
import { LlmCitationResult } from '../../types/core.js';

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
      return this.getMockClaudeResult(keyword, lang);
    } catch (error) {
      log(`Failed to get Claude Web Search results: ${error}`, 'error');
      return null;
    }
  }

  private getMockClaudeResult(keyword: string, lang: string): LlmCitationResult {
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
      own_cited: false,
      excerpt: mockExcerpt,
      answer_present: true,
    };
  }

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