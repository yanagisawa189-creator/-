import { AioResult, SerpResult, DailyResult } from '../types/core.js';
import { log } from '../config.js';

export class AioAnalysisService {
  static extractAioInfo(
    serpResult: SerpResult,
    targetDomains: string[],
    keyword: string,
    runParams: {
      engine: 'google' | 'yahoo';
      device: 'desktop' | 'mobile';
      lang: string;
      location: { type: string; value: string };
    }
  ): Partial<DailyResult> {
    const { aio } = serpResult;

    log(`Extracting AIO info for \"${keyword}\" - AIO present: ${aio?.present || false}`, 'debug');

    if (!aio || !aio.present) {
      return {
        aio_present: false,
        aio_sources: [],
        own_cited: false,
        own_cited_urls: [],
      };
    }

    const aio_sources = aio.sources.map(source => source.url);
    const { own_cited, own_cited_urls } = this.checkOwnDomainCitations(
      aio.sources,
      targetDomains
    );

    log(`AIO analysis: ${aio_sources.length} sources, own_cited: ${own_cited}`, 'debug');

    return {
      aio_present: true,
      aio_sources,
      own_cited,
      own_cited_urls,
    };
  }

  static findOwnRank(serpResult: SerpResult, targetDomains: string[]): number | undefined {
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
      log(`Own domain found at rank ${rank}`, 'debug');
    }

    return rank;
  }

  private static checkOwnDomainCitations(
    sources: { url: string; domain: string }[],
    targetDomains: string[]
  ): { own_cited: boolean; own_cited_urls: string[] } {
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

  private static normalizeDomain(url: string): string {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || url;
    }
  }

  static detectChanges(
    currentResult: DailyResult,
    previousResult?: DailyResult
  ): {
    aio_status_changed: boolean;
    citation_status_changed: boolean;
    rank_changed: boolean;
    rank_change_amount?: number;
  } {
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
      log(`Changes detected - AIO: ${aio_status_changed}, Citation: ${citation_status_changed}, Rank: ${rank_changed}`, 'info');
    }

    return {
      aio_status_changed,
      citation_status_changed,
      rank_changed,
      rank_change_amount,
    };
  }
}