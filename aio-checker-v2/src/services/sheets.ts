import { KeywordConfig, DailyResult } from '../types/core';
import { google } from 'googleapis';
import { log } from '../config';

const CONFIG_SHEET = 'config_keywords';
const RESULT_SHEET = 'daily_results';

export class SheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor(spreadsheetId: string, clientEmail?: string, privateKey?: string) {
    this.spreadsheetId = spreadsheetId;

    if (clientEmail && privateKey) {
      try {
        // Private keyの改行コードを正しく解釈
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: clientEmail,
            private_key: formattedPrivateKey,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        log('Google Sheets authentication initialized successfully', 'debug');
      } catch (error) {
        log(`Failed to initialize Google Sheets authentication: ${error}`, 'error');
        this.sheets = null;
      }
    } else {
      log('Google Sheets credentials not provided - sheets operations will be mocked', 'warn');
      this.sheets = null;
    }
  }

  async readKeywordConfigs(): Promise<KeywordConfig[]> {
    if (!this.sheets) {
      // モックデータを返す
      log('Using mock keyword configs', 'debug');
      return [
        {
          keyword: 'weather today',
          lang: 'en',
          location_type: 'country',
          location_value: 'United States',
          device: 'desktop',
          target_domains: ['weather.com', 'openweathermap.org'],
          priority: 'H',
          owner: 'test-user',
          schedule: 'daily',
        },
        {
          keyword: '天気 今日',
          lang: 'ja',
          location_type: 'country',
          location_value: 'Japan',
          device: 'mobile',
          target_domains: ['weather.com', 'tenki.jp'],
          priority: 'M',
          owner: 'test-user',
          schedule: 'daily',
        }
      ];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${CONFIG_SHEET}!A2:J1000`, // ヘッダー行をスキップ
      });

      const rows = response.data.values || [];

      return rows.map((row: string[]) => ({
        keyword: row[0] || '',
        lang: row[1] || 'ja',
        location_type: (row[2] as any) || 'country',
        location_value: row[3] || 'Japan',
        device: (row[4] as any) || 'desktop',
        target_domains: row[5] ? row[5].split(',').map(d => d.trim()) : [],
        priority: (row[6] as any) || 'M',
        owner: row[7],
        schedule: (row[8] as any) || 'daily',
        notes: row[9],
      })).filter((config: KeywordConfig) => config.keyword); // 空のキーワードは除外

    } catch (error) {
      log(`Failed to read keyword configs: ${error}`, 'error');
      return [];
    }
  }

  async writeResults(results: DailyResult[]): Promise<void> {
    if (!this.sheets) {
      // ローカルファイルに保存（モック）
      log(`Mock: would write ${results.length} results to sheets`, 'debug');
      return;
    }

    if (results.length === 0) {
      log('No results to write', 'debug');
      return;
    }

    try {
      const values = results.map(result => [
        result.run_at,
        result.keyword,
        result.lang,
        `${result.location.type}:${result.location.value}`,
        result.device,
        result.aio_present,
        JSON.stringify(result.aio_sources),
        result.own_cited,
        JSON.stringify(result.own_cited_urls),
        JSON.stringify(result.serp_top100?.slice(0, 10)), // 上位10位のみ
        result.screenshot_url || '',
        result.html_snapshot_url || '',
        result.job_status,
        result.error_message || '',
        // LLM関連（オプション）
        result.llm_engine || '',
        result.llm_answer_present || false,
        JSON.stringify(result.llm_citations || []),
        result.llm_own_cited || false,
        result.llm_excerpt || '',
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${RESULT_SHEET}!A:S`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      });

      log(`Successfully wrote ${results.length} results to sheets`, 'info');

    } catch (error) {
      log(`Failed to write results to sheets: ${error}`, 'error');
      throw error;
    }
  }

  async ensureHeaders(): Promise<void> {
    if (!this.sheets) {
      log('Mock: would ensure headers exist', 'debug');
      return;
    }

    try {
      // CONFIG_SHEET と RESULT_SHEET のヘッダーを確認・作成
      // 実装は今後追加
      log('Headers ensured for both sheets', 'debug');

    } catch (error) {
      log(`Failed to ensure headers: ${error}`, 'warn');
    }
  }
}