import fetch from 'node-fetch';
import { SerpProvider } from './provider.js';
import { RunParams, SerpResult, AioResult, SerpItem } from '../../types/core.js';
import { log } from '../../config.js';

export class GoogleSerpApiProvider extends SerpProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  getEngine(): 'google' {
    return 'google';
  }

  async getTop100(params: RunParams): Promise<SerpResult> {
    const { keyword, lang, location, device } = params;

    log(`Fetching Google SERP for \"${keyword}\" (${device}, ${lang})`, 'debug');

    return this.retryWithBackoff(async () => {
      const searchParams = new URLSearchParams({
        api_key: this.apiKey,
        engine: 'google',
        q: keyword,
        hl: lang,
        gl: this.getCountryCode(location?.value || 'United States'),
        device: device,
        num: '100',
        start: '0',
      });

      if (location && location.type === 'city') {
        searchParams.set('location', location.value);
      }

      const url = `https://serpapi.com/search?${searchParams.toString()}`;

      log(`SerpAPI URL: ${url.replace(this.apiKey, '[REDACTED]')}`, 'debug');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'AIO-Checker-MVP/0.1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      log(`SerpAPI response received: ${JSON.stringify(data).length} characters`, 'debug');

      const aio = this.extractAioData(data);
      const organic = this.extractOrganicResults(data);

      return {
        engine: 'google',
        aio,
        organic,
        own_rank: undefined,
      };
    }, `Google SERP for \"${keyword}\"`);
  }

  private extractAioData(data: any): AioResult | null {
    if (data.ai_overview) {
      const sources = (data.ai_overview.sources || []).map((source: any) => ({
        url: source.link,
        domain: this.normalizeDomain(source.link),
      }));

      return {
        present: true,
        sources,
        text_length: data.ai_overview.text?.length,
        heading_count: undefined,
        has_followup_questions: Boolean(data.ai_overview.followup_questions?.length),
      };
    }

    if (data.answer_box && data.answer_box.sources) {
      const sources = data.answer_box.sources.map((source: any) => ({
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

  private extractOrganicResults(data: any): SerpItem[] {
    if (!data.organic_results) {
      return [];
    }

    return data.organic_results
      .slice(0, 100)
      .map((result: any) => ({
        rank: result.position,
        domain: result.domain || this.normalizeDomain(result.link),
        url: result.link,
        title: result.title,
      }));
  }

  private getCountryCode(locationValue: string): string {
    const mapping: Record<string, string> = {
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