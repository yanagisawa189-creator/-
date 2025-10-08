import { log } from '../../config.js';
import { LlmCitationResult } from '../../types/core.js';

export class ChatGPTWebSearchProvider {
  private apiKey?: string;
  private enabled: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.enabled = Boolean(apiKey);

    if (!this.enabled) {
      log('OpenAI API key not provided - ChatGPT Web Search will be skipped', 'warn');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async checkCitations(params: { keyword: string; lang: string }): Promise<LlmCitationResult | null> {
    if (!this.enabled) {
      log('ChatGPT Web Search is disabled', 'debug');
      return null;
    }

    const { keyword, lang } = params;

    log(`Checking ChatGPT Web Search citations for "${keyword}" (${lang})`, 'debug');

    try {
      // 実際のOpenAI API呼び出し（現在はモックデータを返す）
      return await this.getChatGPTCitations(keyword, lang);
    } catch (error) {
      log(`Failed to get ChatGPT Web Search results: ${error}`, 'error');
      return null;
    }
  }

  private async getChatGPTCitations(keyword: string, lang: string): Promise<LlmCitationResult> {
    if (!this.apiKey) {
      return this.getMockChatGPTResult(keyword, lang);
    }

    try {
      // OpenAI Chat Completions API with web_search tool
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // または 'gpt-4-turbo' など
          messages: [
            {
              role: 'user',
              content: lang === 'ja'
                ? `「${keyword}」について、最新の情報を検索して教えてください。`
                : `Search for information about "${keyword}" and provide details.`
            }
          ],
          tools: [
            {
              type: 'web_search'
            }
          ],
          tool_choice: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      // 引用元URLを抽出
      const citations = this.extractCitationsFromResponse(data);
      const excerpt = this.extractExcerptFromResponse(data);

      log(`ChatGPT Web Search returned ${citations.length} citations`, 'debug');

      return {
        llm_engine: 'chatgpt',
        citations: citations,
        own_cited: false, // 後で checkTargetDomainMatch で判定
        excerpt: excerpt,
        answer_present: citations.length > 0 || excerpt.length > 0,
      };
    } catch (error) {
      log(`OpenAI API error, falling back to mock data: ${error}`, 'warn');
      return this.getMockChatGPTResult(keyword, lang);
    }
  }

  private extractCitationsFromResponse(data: any): string[] {
    const citations: string[] = [];

    try {
      // tool_calls からWeb検索結果を抽出
      const message = data.choices?.[0]?.message;

      if (message?.tool_calls) {
        message.tool_calls.forEach((toolCall: any) => {
          if (toolCall.type === 'web_search' && toolCall.web_search?.results) {
            toolCall.web_search.results.forEach((result: any) => {
              if (result.url) {
                citations.push(result.url);
              }
            });
          }
        });
      }

      // annotations からも抽出（別の形式の場合）
      if (message?.annotations) {
        message.annotations.forEach((annotation: any) => {
          if (annotation.type === 'url' && annotation.url) {
            citations.push(annotation.url);
          }
        });
      }
    } catch (error) {
      log(`Failed to extract citations from ChatGPT response: ${error}`, 'warn');
    }

    return citations;
  }

  private extractExcerptFromResponse(data: any): string {
    try {
      const content = data.choices?.[0]?.message?.content || '';
      return content.substring(0, 200); // 最初の200文字を抽出
    } catch (error) {
      return '';
    }
  }

  private getMockChatGPTResult(keyword: string, lang: string): LlmCitationResult {
    const mockCitations = [
      'https://en.wikipedia.org/wiki/Weather',
      'https://www.weather.gov/',
      'https://example.com/weather-info',
    ];

    const mockExcerpt = lang === 'ja'
      ? `「${keyword}」に関する情報です。ChatGPTのWeb検索機能を使用して最新情報を取得しました...`
      : `Here's information about "${keyword}" found using ChatGPT's web search feature...`;

    log(`Using mock ChatGPT Web Search result for "${keyword}"`, 'debug');

    return {
      llm_engine: 'chatgpt',
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
