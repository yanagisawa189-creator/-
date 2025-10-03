#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';
import { validateConfig, log, appConfig, getCurrentTimestamp } from './config.js';
import { SheetsService } from './services/sheets.js';
import { GoogleSerpApiProvider } from './providers/serp/google-serpapi.js';
import { YahooSerpProvider } from './providers/serp/yahoo.js';
import { ClaudeWebSearchProvider } from './providers/llm/claude.js';
import { AioAnalysisService } from './services/aio.js';
import { KeywordConfig, DailyResult } from './types/core.js';

async function main() {
  try {
    log('=== AIO表示チェッカー v0.1 MVP ===');

    validateConfig();

    const sheetsService = new SheetsService(
      appConfig.spreadsheetId,
      null // Google Sheets credentials loading disabled for MVP
    );

    const googleProvider = new GoogleSerpApiProvider(appConfig.serpApiKey);
    const yahooProvider = new YahooSerpProvider();
    const claudeProvider = new ClaudeWebSearchProvider(appConfig.anthropicApiKey);

    await sheetsService.ensureHeaders();

    const keywordConfigs = await sheetsService.readKeywordConfigs();

    if (keywordConfigs.length === 0) {
      log('監視対象キーワードが見つかりません。', 'warn');
      return;
    }

    log(`監視対象キーワード: ${keywordConfigs.length}件`);

    const allResults: DailyResult[] = [];

    for (const config of keywordConfigs) {
      log(`\\n--- 処理開始: \"${config.keyword}\" ---`);

      try {
        const googleResult = await processKeyword(
          config,
          googleProvider,
          claudeProvider
        );
        if (googleResult) allResults.push(googleResult);

        const yahooResult = await processKeyword(
          config,
          yahooProvider,
          null
        );
        if (yahooResult) allResults.push(yahooResult);

        displayResultSummary(config.keyword, googleResult, yahooResult);

      } catch (error) {
        log(`キーワード \"${config.keyword}\" の処理中にエラー: ${error}`, 'error');
      }
    }

    if (allResults.length > 0) {
      await sheetsService.writeResults(allResults);
      await saveResultsLocally(allResults);
      log(`\\n=== 処理完了: ${allResults.length}件の結果を保存 ===`);
    } else {
      log('保存する結果がありません。', 'warn');
    }

  } catch (error) {
    log(`全体処理でエラー: ${error instanceof Error ? error.message : String(error)}`, 'error');
    process.exit(1);
  }
}

async function processKeyword(
  config: KeywordConfig,
  serpProvider: GoogleSerpApiProvider | YahooSerpProvider,
  claudeProvider: ClaudeWebSearchProvider | null
): Promise<DailyResult | null> {
  const engine = serpProvider.getEngine();

  try {
    const serpResult = await serpProvider.getTop100({
      keyword: config.keyword,
      lang: config.lang,
      location: {
        type: config.location_type,
        value: config.location_value,
      },
      device: config.device,
    });

    const aioInfo = AioAnalysisService.extractAioInfo(
      serpResult,
      config.target_domains,
      config.keyword,
      {
        engine,
        device: config.device,
        lang: config.lang,
        location: { type: config.location_type, value: config.location_value },
      }
    );

    const ownRank = AioAnalysisService.findOwnRank(serpResult, config.target_domains);

    const result: DailyResult = {
      run_at: getCurrentTimestamp(),
      engine,
      device: config.device,
      lang: config.lang,
      location: {
        type: config.location_type,
        value: config.location_value,
      },
      keyword: config.keyword,
      serp_rank: ownRank,
      serp_top100: serpResult.organic,
      job_status: 'ok',
      aio_present: aioInfo.aio_present || false,
      aio_sources: aioInfo.aio_sources || [],
      own_cited: aioInfo.own_cited || false,
      own_cited_urls: aioInfo.own_cited_urls || [],
    };

    if (engine === 'google' && claudeProvider && claudeProvider.isEnabled()) {
      try {
        const claudeResult = await claudeProvider.checkCitations({
          keyword: config.keyword,
          lang: config.lang,
        });

        if (claudeResult) {
          const llmOwnCited = claudeProvider.checkTargetDomainMatch(
            claudeResult.citations,
            config.target_domains
          );

          result.llm_engine = claudeResult.llm_engine;
          result.llm_answer_present = claudeResult.answer_present;
          result.llm_citations = claudeResult.citations;
          result.llm_own_cited = llmOwnCited;
          result.llm_excerpt = claudeResult.excerpt;
        }
      } catch (error) {
        log(`Claude Web Searchエラー: ${error}`, 'warn');
      }
    }

    return result;

  } catch (error) {
    log(`${engine}検索エラー (\"${config.keyword}\"): ${error}`, 'error');

    return {
      run_at: getCurrentTimestamp(),
      engine,
      device: config.device,
      lang: config.lang,
      location: {
        type: config.location_type,
        value: config.location_value,
      },
      keyword: config.keyword,
      aio_present: false,
      aio_sources: [],
      own_cited: false,
      own_cited_urls: [],
      serp_top100: [],
      job_status: 'fail',
      error_message: error instanceof Error ? error.message : String(error),
    };
  }
}

function displayResultSummary(
  keyword: string,
  googleResult?: DailyResult | null,
  yahooResult?: DailyResult | null
): void {
  log(`\\n【結果サマリ: \"${keyword}\"】`);

  if (googleResult) {
    log(`Google: AIO=${googleResult.aio_present ? '✓' : '–'} 自社参照=${googleResult.own_cited ? '★' : '–'} 順位=${googleResult.serp_rank || 'N/A'}`);
    if (googleResult.aio_present) {
      log(`  AIOソース: ${googleResult.aio_sources.slice(0, 3).join(', ')}${googleResult.aio_sources.length > 3 ? '...' : ''}`);
    }
    if (googleResult.llm_engine) {
      log(`  Claude: 回答=${googleResult.llm_answer_present ? '✓' : '–'} 自社引用=${googleResult.llm_own_cited ? '★' : '–'}`);
    }
  }

  if (yahooResult) {
    log(`Yahoo!: 順位=${yahooResult.serp_rank || 'N/A'} (上位3件: ${yahooResult.serp_top100.slice(0, 3).map(item => item.domain).join(', ')})`);
  }
}

async function saveResultsLocally(results: DailyResult[]): Promise<void> {
  try {
    const outputDir = appConfig.outputDir;
    const today = new Date().toISOString().split('T')[0];
    const dateDir = join(outputDir, today);

    await fs.mkdir(dateDir, { recursive: true });

    const timestamp = getCurrentTimestamp().replace(/[:.]/g, '-');
    const filename = `results_${timestamp}.json`;
    const filePath = join(dateDir, filename);

    await fs.writeFile(filePath, JSON.stringify(results, null, 2));

    log(`ローカル保存: ${filePath}`, 'debug');

  } catch (error) {
    log(`ローカル保存エラー: ${error}`, 'warn');
  }
}

if (process.argv.includes('--run-once')) {
  process.env.RUN_ONCE = 'true';
}

main();