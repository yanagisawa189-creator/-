import { screenshotService, ScreenshotResult } from './screenshot.js';
import { AioAnalysisService } from './aio.js';
import { RunParams, DailyResult, ScreenshotData, SerpResult } from '../types/core.js';
import { log, config } from '../config.js';

export interface CheckResult {
  dailyResult: DailyResult;
  screenshots?: ScreenshotData;
}

export class CheckerService {
  /**
   * Run complete check with screenshots
   */
  static async runCheckWithScreenshots(
    serpResult: SerpResult,
    runParams: RunParams & { engine: 'google' | 'yahoo' },
    keyword: string,
    targetDomains: string[],
    captureScreenshots: boolean = true
  ): Promise<CheckResult> {
    log(`Running check for keyword: "${keyword}" with screenshots: ${captureScreenshots}`, 'info');

    // Extract AIO information
    const locationParam = runParams.location || { type: 'country', value: 'JP' };
    const aioInfo = AioAnalysisService.extractAioInfo(serpResult, targetDomains, keyword, {
      engine: runParams.engine,
      device: runParams.device,
      lang: runParams.lang,
      location: locationParam
    });
    const ownRank = AioAnalysisService.findOwnRank(serpResult, targetDomains);

    // Build base result
    const dailyResult: DailyResult = {
      run_at: new Date().toISOString(),
      engine: runParams.engine,
      device: runParams.device,
      lang: runParams.lang,
      location: locationParam,
      keyword,
      aio_present: aioInfo.aio_present || false,
      aio_sources: aioInfo.aio_sources || [],
      own_cited: aioInfo.own_cited || false,
      own_cited_urls: aioInfo.own_cited_urls || [],
      serp_rank: ownRank,
      serp_top100: serpResult.organic.slice(0, 100),
      job_status: 'ok',
    };

    // Capture screenshots if enabled
    let screenshots: ScreenshotData | undefined;
    if (captureScreenshots) {
      try {
        screenshots = await this.captureAllScreenshots(keyword, runParams.engine, runParams.device);
        dailyResult.screenshot_data = screenshots;

        // Set primary screenshot path
        if (runParams.device === 'desktop' && screenshots.desktop_path) {
          dailyResult.screenshot_path = screenshots.desktop_path;
        } else if (runParams.device === 'mobile' && screenshots.mobile_path) {
          dailyResult.screenshot_path = screenshots.mobile_path;
        }
      } catch (error) {
        log(`Failed to capture screenshots: ${error}`, 'error');
        dailyResult.job_status = 'partial';
        dailyResult.error_message = `Screenshot capture failed: ${error}`;
      }
    }

    return {
      dailyResult,
      screenshots,
    };
  }

  /**
   * Capture all screenshots for a keyword
   */
  private static async captureAllScreenshots(
    keyword: string,
    engine: 'google' | 'yahoo',
    device: 'desktop' | 'mobile'
  ): Promise<ScreenshotData> {
    log(`Capturing screenshots for "${keyword}" on ${engine} (${device})`, 'info');

    const screenshots: ScreenshotData = {
      timestamp: new Date().toISOString(),
    };

    try {
      if (engine === 'google') {
        // Capture Google search results
        const searchResult = await screenshotService.captureGoogleSearch(keyword, device);
        if (device === 'desktop') {
          screenshots.desktop_path = searchResult.path;
        } else {
          screenshots.mobile_path = searchResult.path;
        }

        // Capture AI Overview if present
        try {
          const aioResult = await screenshotService.captureGoogleAIOverview(keyword, device);
          if (device === 'desktop') {
            screenshots.aio_desktop_path = aioResult.path;
          } else {
            screenshots.aio_mobile_path = aioResult.path;
          }
          log(`AI Overview screenshot captured: ${aioResult.filename}`, 'debug');
        } catch (error) {
          log(`AI Overview screenshot failed (may not be present): ${error}`, 'debug');
        }
      } else if (engine === 'yahoo') {
        // Capture Yahoo! search results
        const searchResult = await screenshotService.captureYahooSearch(keyword, device);
        if (device === 'desktop') {
          screenshots.desktop_path = searchResult.path;
        } else {
          screenshots.mobile_path = searchResult.path;
        }
      }

      log(`Screenshots captured successfully for "${keyword}"`, 'info');
    } catch (error) {
      log(`Error capturing screenshots: ${error}`, 'error');
      throw error;
    }

    return screenshots;
  }

  /**
   * Capture screenshots for both desktop and mobile
   */
  static async captureMultiDeviceScreenshots(
    keyword: string,
    engine: 'google' | 'yahoo'
  ): Promise<ScreenshotData> {
    log(`Capturing multi-device screenshots for "${keyword}"`, 'info');

    const screenshots: ScreenshotData = {
      timestamp: new Date().toISOString(),
    };

    try {
      // Capture desktop and mobile in parallel
      const [desktopResult, mobileResult] = await Promise.all([
        engine === 'google'
          ? screenshotService.captureGoogleSearch(keyword, 'desktop')
          : screenshotService.captureYahooSearch(keyword, 'desktop'),
        engine === 'google'
          ? screenshotService.captureGoogleSearch(keyword, 'mobile')
          : screenshotService.captureYahooSearch(keyword, 'mobile'),
      ]);

      screenshots.desktop_path = desktopResult.path;
      screenshots.mobile_path = mobileResult.path;

      // Capture Google AI Overview for both devices if Google
      if (engine === 'google') {
        try {
          const [aioDesktop, aioMobile] = await Promise.all([
            screenshotService.captureGoogleAIOverview(keyword, 'desktop'),
            screenshotService.captureGoogleAIOverview(keyword, 'mobile'),
          ]);
          screenshots.aio_desktop_path = aioDesktop.path;
          screenshots.aio_mobile_path = aioMobile.path;
        } catch (error) {
          log(`AI Overview multi-device capture failed: ${error}`, 'debug');
        }
      }

      log(`Multi-device screenshots captured successfully`, 'info');
    } catch (error) {
      log(`Error capturing multi-device screenshots: ${error}`, 'error');
      throw error;
    }

    return screenshots;
  }

  /**
   * Initialize screenshot service
   */
  static async initialize(): Promise<void> {
    await screenshotService.initialize();
  }

  /**
   * Cleanup screenshot service
   */
  static async cleanup(): Promise<void> {
    await screenshotService.close();
  }
}
