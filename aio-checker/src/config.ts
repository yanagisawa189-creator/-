import { config } from 'dotenv';
import { RetryConfig } from './types/core.js';

config();

export const appConfig = {
  serpApiKey: process.env.SERPAPI_API_KEY || '',
  spreadsheetId: process.env.SHEET_ID || '',
  googleCredentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
  targetDomains: process.env.TARGET_DOMAINS?.split(',').map(d => d.trim()) || [],
  outputDir: process.env.OUTPUT_DIR || './runs',
  screenshotDir: process.env.SCREENSHOT_DIR || './screenshots',
  debug: process.env.DEBUG === 'true',
  runOnce: process.env.RUN_ONCE === 'true',
} as const;

// Alias for backward compatibility
export { appConfig as config };

export const retryConfig: RetryConfig = {
  maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
  baseDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
  maxDelayMs: 30000,
} as const;

export function validateConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!appConfig.serpApiKey) {
    errors.push('SERPAPI_API_KEY is required for Google search');
  }

  if (!appConfig.spreadsheetId) {
    warnings.push('SHEET_ID not provided - sheets operations will use mock data');
  }

  if (!appConfig.anthropicApiKey) {
    warnings.push('ANTHROPIC_API_KEY not provided - Claude Web Search will be skipped');
  }

  if (!appConfig.openaiApiKey) {
    warnings.push('OPENAI_API_KEY not provided - ChatGPT Web Search will be skipped');
  }

  if (!appConfig.googleAiApiKey) {
    warnings.push('GOOGLE_AI_API_KEY not provided - Gemini Grounding will be skipped');
  }

  if (appConfig.targetDomains.length === 0) {
    warnings.push('No TARGET_DOMAINS specified - own domain analysis will be skipped');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\\n${errors.join('\\n')}`);
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => log(warning, 'warn'));
  }
}

export function log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
  if (level === 'debug' && !appConfig.debug) return;

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

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}