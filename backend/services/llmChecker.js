const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const playwright = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * マルチLLM AIOチェッカー
 * ChatGPT, Claude, Gemini, Google AIO に対応
 */
class LLMChecker {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

        this.screenshotDir = process.env.SCREENSHOT_PATH || './screenshots';
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    /**
     * ChatGPT (OpenAI) でチェック
     */
    async checkChatGPT(keyword, targetDomain) {
        try {
            const prompt = `Please search for information about "${keyword}" and provide sources. Include URLs of your sources.`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            const answer = response.choices[0].message.content;
            const isCited = this.checkDomainInText(answer, targetDomain);

            return {
                llm_type: 'chatgpt',
                is_cited: isCited,
                raw_response: answer,
                citation_text: isCited ? this.extractCitationContext(answer, targetDomain) : null,
                status: 'success'
            };
        } catch (error) {
            console.error('ChatGPT check error:', error);
            return {
                llm_type: 'chatgpt',
                is_cited: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Claude (Anthropic) でチェック
     */
    async checkClaude(keyword, targetDomain) {
        try {
            const prompt = `Please provide information about "${keyword}" with sources and URLs.`;

            const message = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const answer = message.content[0].text;
            const isCited = this.checkDomainInText(answer, targetDomain);

            return {
                llm_type: 'claude',
                is_cited: isCited,
                raw_response: answer,
                citation_text: isCited ? this.extractCitationContext(answer, targetDomain) : null,
                status: 'success'
            };
        } catch (error) {
            console.error('Claude check error:', error);
            return {
                llm_type: 'claude',
                is_cited: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Gemini (Google AI) でチェック
     */
    async checkGemini(keyword, targetDomain) {
        try {
            const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = `Please provide information about "${keyword}" with sources and URLs.`;

            const result = await model.generateContent(prompt);
            const answer = result.response.text();
            const isCited = this.checkDomainInText(answer, targetDomain);

            return {
                llm_type: 'gemini',
                is_cited: isCited,
                raw_response: answer,
                citation_text: isCited ? this.extractCitationContext(answer, targetDomain) : null,
                status: 'success'
            };
        } catch (error) {
            console.error('Gemini check error:', error);
            return {
                llm_type: 'gemini',
                is_cited: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Google Search AI Overviews をスクリーンショット付きでチェック
     */
    async checkGoogleAIO(keyword, targetDomain) {
        const browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        try {
            // Google検索実行
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`);
            await page.waitForTimeout(3000); // AI Overviewsの読み込み待機

            // AI Overviewsセクションを検索
            const aioSelector = '[data-attrid="AIOverview"], [data-sgrd="true"], .ULSxyf';
            const aioElement = await page.$(aioSelector);

            let screenshotPath = null;
            let isCited = false;
            let citationText = null;

            if (aioElement) {
                // スクリーンショット保存
                const timestamp = Date.now();
                screenshotPath = path.join(
                    this.screenshotDir,
                    `google_aio_${keyword.replace(/\s+/g, '_')}_${timestamp}.png`
                );

                await aioElement.screenshot({ path: screenshotPath });

                // AI Overviewsのテキスト取得
                const aioText = await aioElement.textContent();
                isCited = this.checkDomainInText(aioText, targetDomain);

                if (isCited) {
                    citationText = this.extractCitationContext(aioText, targetDomain);
                }
            }

            await browser.close();

            return {
                llm_type: 'google_aio',
                is_cited: isCited,
                raw_response: aioElement ? await aioElement.textContent() : null,
                citation_text: citationText,
                screenshot_path: screenshotPath,
                status: 'success'
            };
        } catch (error) {
            await browser.close();
            console.error('Google AIO check error:', error);
            return {
                llm_type: 'google_aio',
                is_cited: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * 全LLMで一括チェック
     */
    async checkAllLLMs(keyword, targetDomain) {
        const results = await Promise.allSettled([
            this.checkChatGPT(keyword, targetDomain),
            this.checkClaude(keyword, targetDomain),
            this.checkGemini(keyword, targetDomain),
            this.checkGoogleAIO(keyword, targetDomain)
        ]);

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                const llmTypes = ['chatgpt', 'claude', 'gemini', 'google_aio'];
                return {
                    llm_type: llmTypes[index],
                    is_cited: false,
                    status: 'error',
                    error: result.reason?.message || 'Unknown error'
                };
            }
        });
    }

    /**
     * ドメインがテキスト内に含まれているかチェック
     */
    checkDomainInText(text, domain) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const regex = new RegExp(cleanDomain, 'i');
        return regex.test(text);
    }

    /**
     * 引用箇所のコンテキストを抽出
     */
    extractCitationContext(text, domain) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const sentences = text.split(/[.!?。！？]/);

        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(cleanDomain.toLowerCase())) {
                return sentence.trim();
            }
        }

        return text.substring(0, 200); // 最初の200文字を返す
    }

    /**
     * スクリーンショットの比較用サムネイル生成
     */
    async createThumbnail(screenshotPath) {
        // 実装: ImageMagickやSharpを使用してサムネイル生成
        // ここでは省略
        return screenshotPath;
    }
}

module.exports = LLMChecker;
