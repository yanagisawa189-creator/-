#!/usr/bin/env ts-node
/**
 * Screenshot functionality test script
 * Tests the screenshot capture for Google, Yahoo, and AI Overview
 */

import { screenshotService } from './services/screenshot.js';
import { CheckerService } from './services/checker.js';
import { log } from './config.js';

async function main() {
  console.log('🚀 Starting screenshot functionality test...\n');

  try {
    // Initialize screenshot service
    console.log('📸 Initializing screenshot service...');
    await screenshotService.initialize();
    console.log('✅ Screenshot service initialized\n');

    // Test keyword
    const testKeyword = 'SEO対策';

    // Test 1: Google Search Screenshot (Desktop)
    console.log('Test 1: Capturing Google search (Desktop)...');
    const googleDesktop = await screenshotService.captureGoogleSearch(testKeyword, 'desktop');
    console.log(`✅ Screenshot saved: ${googleDesktop.filename}`);
    console.log(`   Path: ${googleDesktop.path}\n`);

    // Test 2: Google Search Screenshot (Mobile)
    console.log('Test 2: Capturing Google search (Mobile)...');
    const googleMobile = await screenshotService.captureGoogleSearch(testKeyword, 'mobile');
    console.log(`✅ Screenshot saved: ${googleMobile.filename}`);
    console.log(`   Path: ${googleMobile.path}\n`);

    // Test 3: Google AI Overview Screenshot
    console.log('Test 3: Capturing Google AI Overview...');
    try {
      const aioDesktop = await screenshotService.captureGoogleAIOverview(testKeyword, 'desktop');
      console.log(`✅ AI Overview screenshot saved: ${aioDesktop.filename}`);
      console.log(`   Path: ${aioDesktop.path}\n`);
    } catch (error) {
      console.log(`⚠️  AI Overview may not be present for this keyword`);
      console.log(`   Error: ${error}\n`);
    }

    // Test 4: Yahoo! Search Screenshot
    console.log('Test 4: Capturing Yahoo! search...');
    const yahooDesktop = await screenshotService.captureYahooSearch(testKeyword, 'desktop');
    console.log(`✅ Screenshot saved: ${yahooDesktop.filename}`);
    console.log(`   Path: ${yahooDesktop.path}\n`);

    // Test 5: Multi-device capture
    console.log('Test 5: Capturing multi-device screenshots (Google)...');
    const multiDevice = await CheckerService.captureMultiDeviceScreenshots(testKeyword, 'google');
    console.log(`✅ Desktop screenshot: ${multiDevice.desktop_path}`);
    console.log(`✅ Mobile screenshot: ${multiDevice.mobile_path}`);
    if (multiDevice.aio_desktop_path) {
      console.log(`✅ AIO Desktop screenshot: ${multiDevice.aio_desktop_path}`);
    }
    if (multiDevice.aio_mobile_path) {
      console.log(`✅ AIO Mobile screenshot: ${multiDevice.aio_mobile_path}`);
    }
    console.log();

    // Summary
    console.log('═'.repeat(60));
    console.log('🎉 All screenshot tests completed successfully!');
    console.log('═'.repeat(60));
    console.log('\n📁 Screenshots saved in: ./screenshots/');
    console.log('\n💡 Tip: Check the screenshots directory to verify the captures.');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await screenshotService.close();
    console.log('✅ Cleanup complete');
  }
}

// Run test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
