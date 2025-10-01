const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDFレポート生成サービス
 */
class ReportGenerator {
    constructor() {
        this.reportDir = process.env.REPORT_PATH || './reports';
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    /**
     * 週次レポート生成
     */
    async generateWeeklyReport(companyData, checkResults, screenshots) {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const filename = `weekly_report_${companyData.name}_${Date.now()}.pdf`;
        const filepath = path.join(this.reportDir, filename);

        doc.pipe(fs.createWriteStream(filepath));

        // ヘッダー
        doc.fontSize(24).text('AIO Checker - 週次レポート', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`企業名: ${companyData.name}`, { align: 'center' });
        doc.text(`レポート期間: ${this.getWeekRange()}`, { align: 'center' });
        doc.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, { align: 'center' });
        doc.moveDown(2);

        // サマリーセクション
        doc.fontSize(18).text('📊 サマリー', { underline: true });
        doc.moveDown();

        const summary = this.calculateSummary(checkResults);
        doc.fontSize(12);
        doc.text(`総チェック数: ${summary.totalChecks}件`);
        doc.text(`引用検出数: ${summary.totalCitations}件`);
        doc.text(`検出率: ${summary.citationRate}%`);
        doc.moveDown(2);

        // LLM別検出状況
        doc.fontSize(18).text('🤖 LLM別検出状況', { underline: true });
        doc.moveDown();

        const llmStats = this.calculateLLMStats(checkResults);
        doc.fontSize(12);
        doc.text(`ChatGPT: ${llmStats.chatgpt.citations}/${llmStats.chatgpt.total}件 (${llmStats.chatgpt.rate}%)`);
        doc.text(`Claude: ${llmStats.claude.citations}/${llmStats.claude.total}件 (${llmStats.claude.rate}%)`);
        doc.text(`Gemini: ${llmStats.gemini.citations}/${llmStats.gemini.total}件 (${llmStats.gemini.rate}%)`);
        doc.text(`Google AIO: ${llmStats.google_aio.citations}/${llmStats.google_aio.total}件 (${llmStats.google_aio.rate}%)`);
        doc.moveDown(2);

        // キーワード別パフォーマンス
        doc.fontSize(18).text('🎯 キーワード別パフォーマンス', { underline: true });
        doc.moveDown();

        const keywordStats = this.calculateKeywordStats(checkResults);
        doc.fontSize(10);
        keywordStats.slice(0, 10).forEach(stat => {
            doc.text(`• ${stat.keyword}: ${stat.citations}/${stat.total}件 (${stat.rate}%)`);
        });
        doc.moveDown(2);

        // 新規検出
        doc.addPage();
        doc.fontSize(18).text('✨ 今週の新規検出', { underline: true });
        doc.moveDown();

        const newCitations = checkResults.filter(r => r.is_cited && this.isThisWeek(r.check_date));
        if (newCitations.length > 0) {
            newCitations.forEach(citation => {
                doc.fontSize(12).text(`📍 ${citation.keyword}`, { bold: true });
                doc.fontSize(10);
                doc.text(`LLM: ${citation.llm_type}`);
                doc.text(`検出日: ${new Date(citation.check_date).toLocaleDateString('ja-JP')}`);
                if (citation.citation_text) {
                    doc.text(`内容: ${citation.citation_text.substring(0, 100)}...`);
                }
                doc.moveDown();
            });
        } else {
            doc.fontSize(12).text('今週は新規検出がありませんでした。');
        }
        doc.moveDown(2);

        // スクリーンショット添付
        if (screenshots && screenshots.length > 0) {
            doc.addPage();
            doc.fontSize(18).text('📸 スクリーンショット', { underline: true });
            doc.moveDown();

            screenshots.slice(0, 5).forEach((screenshot, index) => {
                if (fs.existsSync(screenshot.path)) {
                    try {
                        doc.fontSize(12).text(`${index + 1}. ${screenshot.keyword} - ${screenshot.llm_type}`);
                        doc.image(screenshot.path, {
                            fit: [500, 300],
                            align: 'center'
                        });
                        doc.moveDown();

                        if ((index + 1) % 2 === 0 && index < screenshots.length - 1) {
                            doc.addPage();
                        }
                    } catch (error) {
                        console.error('Screenshot embed error:', error);
                    }
                }
            });
        }

        // 推奨アクション
        doc.addPage();
        doc.fontSize(18).text('💡 推奨アクション', { underline: true });
        doc.moveDown();

        const recommendations = this.generateRecommendations(summary, llmStats, keywordStats);
        doc.fontSize(12);
        recommendations.forEach(rec => {
            doc.text(`• ${rec}`);
            doc.moveDown(0.5);
        });

        // フッター
        doc.fontSize(10).text('Generated by AIO Checker Pro', {
            align: 'center',
            color: 'gray'
        });

        doc.end();

        return filepath;
    }

    /**
     * サマリー計算
     */
    calculateSummary(results) {
        const totalChecks = results.length;
        const totalCitations = results.filter(r => r.is_cited).length;
        const citationRate = totalChecks > 0 ? Math.round((totalCitations / totalChecks) * 100) : 0;

        return { totalChecks, totalCitations, citationRate };
    }

    /**
     * LLM別統計計算
     */
    calculateLLMStats(results) {
        const llmTypes = ['chatgpt', 'claude', 'gemini', 'google_aio'];
        const stats = {};

        llmTypes.forEach(llm => {
            const llmResults = results.filter(r => r.llm_type === llm);
            const citations = llmResults.filter(r => r.is_cited).length;
            const total = llmResults.length;
            const rate = total > 0 ? Math.round((citations / total) * 100) : 0;

            stats[llm] = { citations, total, rate };
        });

        return stats;
    }

    /**
     * キーワード別統計計算
     */
    calculateKeywordStats(results) {
        const keywordMap = {};

        results.forEach(result => {
            if (!keywordMap[result.keyword]) {
                keywordMap[result.keyword] = { keyword: result.keyword, citations: 0, total: 0 };
            }
            keywordMap[result.keyword].total++;
            if (result.is_cited) {
                keywordMap[result.keyword].citations++;
            }
        });

        const keywordStats = Object.values(keywordMap).map(stat => ({
            ...stat,
            rate: stat.total > 0 ? Math.round((stat.citations / stat.total) * 100) : 0
        }));

        return keywordStats.sort((a, b) => b.rate - a.rate);
    }

    /**
     * 推奨アクション生成
     */
    generateRecommendations(summary, llmStats, keywordStats) {
        const recommendations = [];

        // 検出率に基づく推奨
        if (summary.citationRate < 30) {
            recommendations.push('引用検出率が低いです。コンテンツの質と権威性を向上させることを検討してください。');
        } else if (summary.citationRate > 70) {
            recommendations.push('優れた引用検出率です！現在の戦略を継続してください。');
        }

        // LLM別の推奨
        Object.entries(llmStats).forEach(([llm, stats]) => {
            if (stats.rate < 20 && stats.total > 0) {
                recommendations.push(`${llm.toUpperCase()}での検出率が低いです。このプラットフォーム向けのコンテンツ最適化を検討してください。`);
            }
        });

        // キーワード別の推奨
        const lowPerformingKeywords = keywordStats.filter(k => k.rate < 20 && k.total >= 3);
        if (lowPerformingKeywords.length > 0) {
            recommendations.push(`以下のキーワードでのパフォーマンスが低いです: ${lowPerformingKeywords.slice(0, 3).map(k => k.keyword).join(', ')}`);
        }

        if (recommendations.length === 0) {
            recommendations.push('順調に運用されています。継続的なモニタリングを推奨します。');
        }

        return recommendations;
    }

    /**
     * 今週かどうかチェック
     */
    isThisWeek(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo && date <= now;
    }

    /**
     * 週の範囲取得
     */
    getWeekRange() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `${weekAgo.toLocaleDateString('ja-JP')} - ${now.toLocaleDateString('ja-JP')}`;
    }
}

module.exports = ReportGenerator;
