import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config.js';

export interface ScreenshotOptions {
  url: string;
  keyword: string;
  device?: 'desktop' | 'mobile';
  fullPage?: boolean;
}

export interface ScreenshotResult {
  path: string;
  filename: string;
  timestamp: Date;
  device: string;
  url: string;
}

export class ScreenshotService {
  private browser: Browser | null = null;

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Take screenshot of a URL
   */
  async captureScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: options.device === 'mobile'
        ? { width: 375, height: 667 }
        : { width: 1920, height: 1080 },
      userAgent: options.device === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
      // Navigate to URL
      await page.goto(options.url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Generate filename
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0] || '';
      const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1]?.split('.')[0] || '';
      const sanitizedKeyword = options.keyword.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const device = options.device || 'desktop';
      const filename = `${dateStr}_${timeStr}_${sanitizedKeyword}_${device}.png`;

      // Ensure screenshot directory exists
      await fs.mkdir(config.screenshotDir!, { recursive: true });

      const screenshotPath = path.join(config.screenshotDir, filename);

      // Take screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: options.fullPage ?? true
      });

      return {
        path: screenshotPath,
        filename,
        timestamp,
        device,
        url: options.url
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Capture Google Search Results
   */
  async captureGoogleSearch(keyword: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<ScreenshotResult> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ja`;
    return this.captureScreenshot({
      url: searchUrl,
      keyword,
      device,
      fullPage: true
    });
  }

  /**
   * Capture Yahoo! Search Results
   */
  async captureYahooSearch(keyword: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<ScreenshotResult> {
    const searchUrl = `https://search.yahoo.co.jp/search?p=${encodeURIComponent(keyword)}`;
    return this.captureScreenshot({
      url: searchUrl,
      keyword,
      device,
      fullPage: true
    });
  }

  /**
   * Capture Google AI Overview
   */
  async captureGoogleAIOverview(keyword: string, device: 'desktop' | 'mobile' = 'desktop'): Promise<ScreenshotResult> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: device === 'mobile'
        ? { width: 375, height: 667 }
        : { width: 1920, height: 1080 },
      userAgent: device === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ja`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for AI Overview section (if it exists)
      await page.waitForTimeout(3000);

      // Try to find AI Overview element
      const aioElement = await page.$('[data-attrid="AIOverview"], [data-attrid="SGE"]');

      const timestamp = new Date();
      const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0] || '';
      const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1]?.split('.')[0] || '';
      const sanitizedKeyword = keyword.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `${dateStr}_${timeStr}_${sanitizedKeyword}_aio_${device}.png`;

      await fs.mkdir(config.screenshotDir!, { recursive: true });
      const screenshotPath = path.join(config.screenshotDir!, filename);

      if (aioElement) {
        // Screenshot only the AI Overview section
        await aioElement.screenshot({ path: screenshotPath });
      } else {
        // Screenshot full page if no AI Overview found
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      return {
        path: screenshotPath,
        filename,
        timestamp,
        device,
        url: searchUrl
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Capture multiple screenshots at once (desktop + mobile)
   */
  async captureMultiDevice(keyword: string, searchEngine: 'google' | 'yahoo' = 'google'): Promise<{
    desktop: ScreenshotResult;
    mobile: ScreenshotResult;
  }> {
    const captureMethod = searchEngine === 'google'
      ? this.captureGoogleSearch.bind(this)
      : this.captureYahooSearch.bind(this);

    const [desktop, mobile] = await Promise.all([
      captureMethod(keyword, 'desktop'),
      captureMethod(keyword, 'mobile')
    ]);

    return { desktop, mobile };
  }

  /**
   * Capture AI tool results (ChatGPT, Claude, Gemini simulation)
   */
  async captureAIToolResult(toolUrl: string, keyword: string, toolName: string): Promise<ScreenshotResult> {
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0] || '';
    const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1]?.split('.')[0] || '';
    const sanitizedKeyword = keyword.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const sanitizedTool = toolName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${dateStr}_${timeStr}_${sanitizedKeyword}_${sanitizedTool}.png`;

    await this.initialize();

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
      await page.goto(toolUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      await fs.mkdir(config.screenshotDir!, { recursive: true });
      const screenshotPath = path.join(config.screenshotDir!, filename);

      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        path: screenshotPath,
        filename,
        timestamp,
        device: 'desktop',
        url: toolUrl
      };
    } finally {
      await page.close();
      await context.close();
    }
  }
}

// Singleton instance
export const screenshotService = new ScreenshotService();
