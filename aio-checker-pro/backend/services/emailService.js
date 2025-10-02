const nodemailer = require('nodemailer');

/**
 * メール通知サービス
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    /**
     * 新規引用検出通知
     */
    async sendNewCitationAlert(userEmail, companyName, keyword, llmType, screenshotPath) {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `🎉 新規引用検出: ${keyword} - ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #48bb78;">✅ 新規引用が検出されました！</h2>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>企業名:</strong> ${companyName}</p>
                        <p><strong>キーワード:</strong> ${keyword}</p>
                        <p><strong>検出元:</strong> ${llmType.toUpperCase()}</p>
                        <p><strong>検出日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                    </div>
                    ${screenshotPath ? `<p>スクリーンショットが保存されました。ダッシュボードでご確認ください。</p>` : ''}
                    <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">ダッシュボードで確認</a></p>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }

    /**
     * 引用消失警告
     */
    async sendCitationLostAlert(userEmail, companyName, keyword, llmType) {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `⚠️ 引用消失: ${keyword} - ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e53e3e;">⚠️ 引用が検出されなくなりました</h2>
                    <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>企業名:</strong> ${companyName}</p>
                        <p><strong>キーワード:</strong> ${keyword}</p>
                        <p><strong>検出元:</strong> ${llmType.toUpperCase()}</p>
                        <p><strong>確認日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                    </div>
                    <p>以前検出されていた引用が確認できなくなりました。コンテンツの見直しをご検討ください。</p>
                    <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">ダッシュボードで確認</a></p>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }

    /**
     * 週次サマリーレポート
     */
    async sendWeeklySummary(userEmail, companyName, summary, reportPath) {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `📊 週次レポート - ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">📊 週次サマリーレポート</h2>
                    <p>今週の引用状況をお知らせします。</p>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>${companyName}</h3>
                        <p><strong>総チェック数:</strong> ${summary.totalChecks}</p>
                        <p><strong>引用検出数:</strong> ${summary.totalCitations}</p>
                        <p><strong>検出率:</strong> ${summary.citationRate}%</p>
                        <hr style="margin: 15px 0; border: none; border-top: 1px solid #e2e8f0;">
                        <p><strong>LLM別検出状況:</strong></p>
                        <ul>
                            <li>ChatGPT: ${summary.chatgpt || 0}件</li>
                            <li>Claude: ${summary.claude || 0}件</li>
                            <li>Gemini: ${summary.gemini || 0}件</li>
                            <li>Google AIO: ${summary.google_aio || 0}件</li>
                        </ul>
                    </div>
                    <p><a href="${process.env.FRONTEND_URL}/reports" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">詳細レポートを見る</a></p>
                </div>
            `,
            attachments: reportPath ? [{
                filename: 'weekly-report.pdf',
                path: reportPath
            }] : []
        };

        return await this.transporter.sendMail(mailOptions);
    }

    /**
     * 順位変動アラート
     */
    async sendRankChangeAlert(userEmail, companyName, keyword, oldRank, newRank) {
        const isImprovement = newRank < oldRank;
        const color = isImprovement ? '#48bb78' : '#e53e3e';
        const icon = isImprovement ? '📈' : '📉';

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: `${icon} 順位変動: ${keyword} - ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${color};">${icon} 検索順位が変動しました</h2>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>企業名:</strong> ${companyName}</p>
                        <p><strong>キーワード:</strong> ${keyword}</p>
                        <p><strong>変動:</strong> ${oldRank}位 → ${newRank}位 (${isImprovement ? '上昇' : '下降'} ${Math.abs(newRank - oldRank)}位)</p>
                        <p><strong>確認日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                    </div>
                    <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">ダッシュボードで確認</a></p>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }

    /**
     * テストメール送信
     */
    async sendTestEmail(userEmail) {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: userEmail,
            subject: 'AIO Checker - メール通知テスト',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">✅ メール通知設定が完了しました</h2>
                    <p>このメールが届いていれば、メール通知機能が正常に動作しています。</p>
                    <p>今後、以下の場合にメールでお知らせします：</p>
                    <ul>
                        <li>新規引用検出時</li>
                        <li>引用消失時</li>
                        <li>順位変動時</li>
                        <li>週次/月次レポート</li>
                    </ul>
                </div>
            `
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

module.exports = EmailService;
