import { RetryConfig } from './types/core';
export declare const appConfig: {
    readonly serpApiKey: string;
    readonly spreadsheetId: string;
    readonly googleSheetsClientEmail: string;
    readonly googleSheetsPrivateKey: string;
    readonly anthropicApiKey: string;
    readonly targetDomains: string[];
    readonly outputDir: string;
    readonly screenshotDir: string;
    readonly debug: boolean;
    readonly runOnce: boolean;
};
export declare const retryConfig: RetryConfig;
export declare function validateConfig(): void;
export declare function log(message: string, level?: 'info' | 'warn' | 'error' | 'debug'): void;
export declare function getCurrentTimestamp(): string;
//# sourceMappingURL=config.d.ts.map