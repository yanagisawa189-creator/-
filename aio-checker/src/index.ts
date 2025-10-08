#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';
import { validateConfig, log, appConfig, getCurrentTimestamp } from './config.js';
import { SheetsService } from './services/sheets.js';
import { GoogleSerpApiProvider } from './providers/serp/google-serpapi.js';
import { YahooSerpProvider } from './providers/serp/yahoo.js';
import { ClaudeWebSearchProvider } from './providers/llm/claude.js';
import { ChatGPTWebSearchProvider } from './providers/llm/chatgpt.js';
import { GeminiGroundingProvider } from './providers/llm/gemini.js';
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
    const chatgptProvider = new ChatGPTWebSearchProvider(appConfig.openaiApiKey);
    const geminiProvider = new GeminiGroundingProvider(appConfig.googleAiApiKey);

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
          claudeProvider,
          chatgptProvider,
          geminiProvider
        );
        if (googleResult) allResults.push(googleResult);

        const yahooResult = await processKeyword(
          config,
          yahooProvider,
          null,
          null,
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
  claudeProvider: ClaudeWebSearchProvider | null,
  chatgptProvider: ChatGPTWebSearchProvider | null,
  geminiProvider: GeminiGroundingProvider | null
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

    // LLM Citation Checks (Google only)
    const llmResults: any[] = [];

    if (engine === 'google') {
      // Claude Web Search
      if (claudeProvider && claudeProvider.isEnabled()) {
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

            llmResults.push({
              llm_engine: claudeResult.llm_engine,
              llm_answer_present: claudeResult.answer_present,
              llm_citations: claudeResult.citations,
              llm_own_cited: llmOwnCited,
              llm_excerpt: claudeResult.excerpt,
            });
          }
        } catch (error) {
          log(`Claude Web Searchエラー: ${error}`, 'warn');
        }
      }

      // ChatGPT Web Search
      if (chatgptProvider && chatgptProvider.isEnabled()) {
        try {
          const chatgptResult = await chatgptProvider.checkCitations({
            keyword: config.keyword,
            lang: config.lang,
          });

          if (chatgptResult) {
            const llmOwnCited = chatgptProvider.checkTargetDomainMatch(
              chatgptResult.citations,
              config.target_domains
            );

            llmResults.push({
              llm_engine: chatgptResult.llm_engine,
              llm_answer_present: chatgptResult.answer_present,
              llm_citations: chatgptResult.citations,
              llm_own_cited: llmOwnCited,
              llm_excerpt: chatgptResult.excerpt,
            });
          }
        } catch (error) {
          log(`ChatGPT Web Searchエラー: ${error}`, 'warn');
        }
      }

      // Gemini Grounding
      if (geminiProvider && geminiProvider.isEnabled()) {
        try {
          const geminiResult = await geminiProvider.checkCitations({
            keyword: config.keyword,
            lang: config.lang,
          });

          if (geminiResult) {
            const llmOwnCited = geminiProvider.checkTargetDomainMatch(
              geminiResult.citations,
              config.target_domains
            );

            llmResults.push({
              llm_engine: geminiResult.llm_engine,
              llm_answer_present: geminiResult.answer_present,
              llm_citations: geminiResult.citations,
              llm_own_cited: llmOwnCited,
              llm_excerpt: geminiResult.excerpt,
            });
          }
        } catch (error) {
          log(`Gemini Groundingエラー: ${error}`, 'warn');
        }
      }

      // Store first LLM result for backward compatibility
      if (llmResults.length > 0) {
        result.llm_engine = llmResults[0].llm_engine;
        result.llm_answer_present = llmResults[0].llm_answer_present;
        result.llm_citations = llmResults[0].llm_citations;
        result.llm_own_cited = llmResults[0].llm_own_cited;
        result.llm_excerpt = llmResults[0].llm_excerpt;
      }

      // Store all LLM results
      (result as any).llm_results = llmResults;
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

    // Display all LLM results
    const llmResults = (googleResult as any).llm_results || [];
    if (llmResults.length > 0) {
      llmResults.forEach((llm: any) => {
        const engineName = llm.llm_engine === 'claude' ? 'Claude' :
                          llm.llm_engine === 'chatgpt' ? 'ChatGPT' :
                          llm.llm_engine === 'gemini' ? 'Gemini' : llm.llm_engine;
        log(`  ${engineName}: 回答=${llm.llm_answer_present ? '✓' : '–'} 自社引用=${llm.llm_own_cited ? '★' : '–'}`);
      });
    }
  }

  if (yahooResult) {
    log(`Yahoo!: 順位=${yahooResult.serp_rank || 'N/A'} (上位3件: ${yahooResult.serp_top100.slice(0, 3).map(item => item.domain || 'N/A').join(', ')})`);
  }
}

async function saveResultsLocally(results: DailyResult[]): Promise<void> {
  try {
    const outputDir = appConfig.outputDir;
    const today = new Date().toISOString().split('T')[0] || '';
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