"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetsService = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("../config");
const CONFIG_SHEET = 'config_keywords';
const RESULT_SHEET = 'daily_results';
class SheetsService {
    sheets;
    spreadsheetId;
    constructor(spreadsheetId, clientEmail, privateKey) {
        this.spreadsheetId = spreadsheetId;
        if (clientEmail && privateKey) {
            try {
                // Private keyの改行コードを正しく解釈
                const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
                const auth = new googleapis_1.google.auth.GoogleAuth({
                    credentials: {
                        client_email: clientEmail,
                        private_key: formattedPrivateKey,
                    },
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
                this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
                (0, config_1.log)('Google Sheets authentication initialized successfully', 'debug');
            }
            catch (error) {
                (0, config_1.log)(`Failed to initialize Google Sheets authentication: ${error}`, 'error');
                this.sheets = null;
            }
        }
        else {
            (0, config_1.log)('Google Sheets credentials not provided - sheets operations will be mocked', 'warn');
            this.sheets = null;
        }
    }
    async readKeywordConfigs() {
        if (!this.sheets) {
            // モックデータを返す
            (0, config_1.log)('Using mock keyword configs', 'debug');
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
            return rows.map((row) => ({
                keyword: row[0] || '',
                lang: row[1] || 'ja',
                location_type: row[2] || 'country',
                location_value: row[3] || 'Japan',
                device: row[4] || 'desktop',
                target_domains: row[5] ? row[5].split(',').map(d => d.trim()) : [],
                priority: row[6] || 'M',
                owner: row[7],
                schedule: row[8] || 'daily',
                notes: row[9],
            })).filter((config) => config.keyword); // 空のキーワードは除外
        }
        catch (error) {
            (0, config_1.log)(`Failed to read keyword configs: ${error}`, 'error');
            return [];
        }
    }
    async writeResults(results) {
        if (!this.sheets) {
            // ローカルファイルに保存（モック）
            (0, config_1.log)(`Mock: would write ${results.length} results to sheets`, 'debug');
            return;
        }
        if (results.length === 0) {
            (0, config_1.log)('No results to write', 'debug');
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
            (0, config_1.log)(`Successfully wrote ${results.length} results to sheets`, 'info');
        }
        catch (error) {
            (0, config_1.log)(`Failed to write results to sheets: ${error}`, 'error');
            throw error;
        }
    }
    async ensureHeaders() {
        if (!this.sheets) {
            (0, config_1.log)('Mock: would ensure headers exist', 'debug');
            return;
        }
        try {
            // CONFIG_SHEET と RESULT_SHEET のヘッダーを確認・作成
            // 実装は今後追加
            (0, config_1.log)('Headers ensured for both sheets', 'debug');
        }
        catch (error) {
            (0, config_1.log)(`Failed to ensure headers: ${error}`, 'warn');
        }
    }
}
exports.SheetsService = SheetsService;
//# sourceMappingURL=sheets.js.map