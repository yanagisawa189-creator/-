"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryConfig = exports.appConfig = void 0;
exports.validateConfig = validateConfig;
exports.log = log;
exports.getCurrentTimestamp = getCurrentTimestamp;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.appConfig = {
    // SERP API設定
    serpApiKey: process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY || '',
    // Google Sheets設定
    spreadsheetId: process.env.SHEET_ID || '',
    googleSheetsClientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
    googleSheetsPrivateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY || '',
    // Claude API設定
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    // 監視設定
    targetDomains: process.env.TARGET_DOMAINS?.split(',').map(d => d.trim()) || [],
    // 出力設定
    outputDir: process.env.OUTPUT_DIR || './runs',
    screenshotDir: process.env.SCREENSHOT_DIR || './screenshots',
    // デバッグ設定
    debug: process.env.DEBUG === 'true',
    // 実行設定
    runOnce: process.env.RUN_ONCE === 'true',
};
exports.retryConfig = {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    baseDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
    maxDelayMs: 30000,
};
function validateConfig() {
    const errors = [];
    const warnings = [];
    // 必須設定のチェック
    if (!exports.appConfig.serpApiKey) {
        errors.push('SERPAPI_API_KEY is required for Google search');
    }
    if (!exports.appConfig.spreadsheetId) {
        warnings.push('SHEET_ID not provided - sheets operations will use mock data');
    }
    if (!exports.appConfig.googleSheetsClientEmail || !exports.appConfig.googleSheetsPrivateKey) {
        warnings.push('Google Sheets credentials not complete - sheets operations will use mock data');
    }
    if (!exports.appConfig.anthropicApiKey) {
        warnings.push('ANTHROPIC_API_KEY not provided - Claude Web Search will be skipped');
    }
    if (exports.appConfig.targetDomains.length === 0) {
        warnings.push('No TARGET_DOMAINS specified - own domain analysis will be skipped');
    }
    // エラーがあれば例外をスロー
    if (errors.length > 0) {
        throw new Error(`Configuration errors:\\n${errors.join('\\n')}`);
    }
    // 警告があればログ出力
    if (warnings.length > 0) {
        warnings.forEach(warning => log(warning, 'warn'));
    }
}
function log(message, level = 'info') {
    if (level === 'debug' && !exports.appConfig.debug)
        return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    switch (level) {
        case 'error':
            console.error(prefix, message);
            break;
        case 'warn':
            console.warn(prefix, message);
            break;
        case 'debug':
            console.debug(prefix, message);
            break;
        default:
            console.log(prefix, message);
    }
}
function getCurrentTimestamp() {
    return new Date().toISOString();
}
//# sourceMappingURL=config.js.map