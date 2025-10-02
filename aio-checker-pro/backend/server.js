const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
require('dotenv').config();

const LLMChecker = require('./services/llmChecker');
const EmailService = require('./services/emailService');
const ReportGenerator = require('./services/reportGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/screenshots', express.static('screenshots'));
app.use('/reports', express.static('reports'));

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Services
const llmChecker = new LLMChecker();
const emailService = new EmailService();
const reportGenerator = new ReportGenerator();

// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// ==================== 認証API ====================

/**
 * ユーザー登録
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, company_name, plan } = req.body;

        // パスワードハッシュ化
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, company_name, plan) VALUES ($1, $2, $3, $4) RETURNING id, email, company_name, plan',
            [email, password_hash, company_name, plan || 'basic']
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ user, token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * ログイン
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                company_name: user.company_name,
                plan: user.plan
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== 企業管理API ====================

/**
 * 企業一覧取得
 */
app.get('/api/companies', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

/**
 * 企業追加
 */
app.post('/api/companies', authenticateToken, async (req, res) => {
    try {
        const { name, domain, industry, manager, memo } = req.body;

        const result = await pool.query(
            'INSERT INTO companies (user_id, name, domain, industry, manager, memo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.userId, name, domain, industry, manager, memo]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Add company error:', error);
        res.status(500).json({ error: 'Failed to add company' });
    }
});

/**
 * キーワード追加
 */
app.post('/api/companies/:companyId/keywords', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { keywords } = req.body; // Array of keywords

        const queries = keywords.map(keyword =>
            pool.query('INSERT INTO keywords (company_id, keyword) VALUES ($1, $2)', [companyId, keyword])
        );

        await Promise.all(queries);
        res.json({ success: true });
    } catch (error) {
        console.error('Add keywords error:', error);
        res.status(500).json({ error: 'Failed to add keywords' });
    }
});

// ==================== AIOチェックAPI ====================

/**
 * AIOチェック実行
 */
app.post('/api/check/run', authenticateToken, async (req, res) => {
    try {
        const { companyId, keywords } = req.body;

        // 企業情報取得
        const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [companyId, req.user.userId]);
        const company = companyResult.rows[0];

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // 各キーワードで全LLMをチェック
        const results = [];
        for (const keyword of keywords) {
            const llmResults = await llmChecker.checkAllLLMs(keyword, company.domain);

            for (const llmResult of llmResults) {
                // データベースに保存
                const insertResult = await pool.query(
                    `INSERT INTO check_results
                    (company_id, keyword_id, llm_type, is_cited, citation_text, screenshot_path, raw_response, status)
                    VALUES ((SELECT id FROM keywords WHERE company_id = $1 AND keyword = $2 LIMIT 1),
                            (SELECT id FROM keywords WHERE company_id = $1 AND keyword = $2 LIMIT 1),
                            $3, $4, $5, $6, $7, $8)
                    RETURNING *`,
                    [companyId, keyword, llmResult.llm_type, llmResult.is_cited, llmResult.citation_text,
                     llmResult.screenshot_path, llmResult.raw_response, llmResult.status]
                );

                results.push(insertResult.rows[0]);

                // 新規引用検出時に通知
                if (llmResult.is_cited) {
                    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
                    await emailService.sendNewCitationAlert(
                        userResult.rows[0].email,
                        company.name,
                        keyword,
                        llmResult.llm_type,
                        llmResult.screenshot_path
                    );

                    // 通知履歴を保存
                    await pool.query(
                        'INSERT INTO notifications (user_id, type, title, message, sent_email) VALUES ($1, $2, $3, $4, $5)',
                        [req.user.userId, 'new_citation', '新規引用検出',
                         `${keyword}が${llmResult.llm_type}で引用されました`, true]
                    );
                }
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Check run error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});

/**
 * チェック結果取得
 */
app.get('/api/check/results', authenticateToken, async (req, res) => {
    try {
        const { companyId, startDate, endDate } = req.query;

        let query = `
            SELECT cr.*, k.keyword, c.name as company_name
            FROM check_results cr
            JOIN keywords k ON cr.keyword_id = k.id
            JOIN companies c ON cr.company_id = c.id
            WHERE c.user_id = $1
        `;
        const params = [req.user.userId];

        if (companyId) {
            query += ' AND cr.company_id = $2';
            params.push(companyId);
        }

        if (startDate && endDate) {
            query += ` AND cr.check_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(startDate, endDate);
        }

        query += ' ORDER BY cr.check_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// ==================== レポートAPI ====================

/**
 * 週次レポート生成
 */
app.post('/api/reports/weekly', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.body;

        // 企業情報取得
        const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [companyId, req.user.userId]);
        const company = companyResult.rows[0];

        // 1週間分のチェック結果取得
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const resultsQuery = await pool.query(
            `SELECT cr.*, k.keyword FROM check_results cr
             JOIN keywords k ON cr.keyword_id = k.id
             WHERE cr.company_id = $1 AND cr.check_date >= $2
             ORDER BY cr.check_date DESC`,
            [companyId, weekAgo]
        );

        // スクリーンショット取得
        const screenshots = resultsQuery.rows
            .filter(r => r.screenshot_path)
            .map(r => ({ path: r.screenshot_path, keyword: r.keyword, llm_type: r.llm_type }));

        // PDF生成
        const reportPath = await reportGenerator.generateWeeklyReport(company, resultsQuery.rows, screenshots);

        // レポート履歴保存
        await pool.query(
            'INSERT INTO reports (user_id, company_id, report_type, report_path) VALUES ($1, $2, $3, $4)',
            [req.user.userId, companyId, 'weekly', reportPath]
        );

        // メール送信
        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.userId]);
        const summary = reportGenerator.calculateSummary(resultsQuery.rows);
        const llmStats = reportGenerator.calculateLLMStats(resultsQuery.rows);

        await emailService.sendWeeklySummary(userResult.rows[0].email, company.name, { ...summary, ...llmStats }, reportPath);

        res.json({ success: true, reportPath });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ==================== スケジュール設定API ====================

/**
 * スケジュール登録
 */
app.post('/api/schedules', authenticateToken, async (req, res) => {
    try {
        const { companyId, frequency, time } = req.body;

        const result = await pool.query(
            'INSERT INTO schedules (user_id, company_id, frequency, time, enabled) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.userId, companyId, frequency, time, true]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Schedule creation error:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
});

// ==================== 定期実行スケジューラー ====================

// 毎日午前6時に実行
cron.schedule('0 6 * * *', async () => {
    console.log('Running daily scheduled checks...');

    try {
        const schedules = await pool.query(
            `SELECT s.*, c.name, c.domain, u.email
             FROM schedules s
             JOIN companies c ON s.company_id = c.id
             JOIN users u ON s.user_id = u.id
             WHERE s.enabled = true AND s.frequency = 'daily'`
        );

        for (const schedule of schedules.rows) {
            // キーワード取得
            const keywordsResult = await pool.query('SELECT keyword FROM keywords WHERE company_id = $1', [schedule.company_id]);
            const keywords = keywordsResult.rows.map(r => r.keyword);

            // チェック実行
            for (const keyword of keywords) {
                const llmResults = await llmChecker.checkAllLLMs(keyword, schedule.domain);

                for (const llmResult of llmResults) {
                    await pool.query(
                        `INSERT INTO check_results
                        (company_id, keyword_id, llm_type, is_cited, citation_text, screenshot_path, raw_response, status)
                        VALUES ($1, (SELECT id FROM keywords WHERE company_id = $1 AND keyword = $2 LIMIT 1),
                                $3, $4, $5, $6, $7, $8)`,
                        [schedule.company_id, keyword, llmResult.llm_type, llmResult.is_cited,
                         llmResult.citation_text, llmResult.screenshot_path, llmResult.raw_response, llmResult.status]
                    );
                }
            }

            // 最終実行時刻更新
            await pool.query('UPDATE schedules SET last_run = NOW() WHERE id = $1', [schedule.id]);
        }

        console.log('Daily scheduled checks completed.');
    } catch (error) {
        console.error('Scheduled check error:', error);
    }
});

// 毎週月曜日午前7時にレポート生成
cron.schedule('0 7 * * 1', async () => {
    console.log('Generating weekly reports...');

    try {
        const companies = await pool.query('SELECT * FROM companies');

        for (const company of companies.rows) {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const resultsQuery = await pool.query(
                `SELECT cr.*, k.keyword FROM check_results cr
                 JOIN keywords k ON cr.keyword_id = k.id
                 WHERE cr.company_id = $1 AND cr.check_date >= $2`,
                [company.id, weekAgo]
            );

            if (resultsQuery.rows.length > 0) {
                const screenshots = resultsQuery.rows
                    .filter(r => r.screenshot_path)
                    .map(r => ({ path: r.screenshot_path, keyword: r.keyword, llm_type: r.llm_type }));

                const reportPath = await reportGenerator.generateWeeklyReport(company, resultsQuery.rows, screenshots);

                const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [company.user_id]);
                const summary = reportGenerator.calculateSummary(resultsQuery.rows);
                const llmStats = reportGenerator.calculateLLMStats(resultsQuery.rows);

                await emailService.sendWeeklySummary(userResult.rows[0].email, company.name, { ...summary, ...llmStats }, reportPath);
            }
        }

        console.log('Weekly reports generated.');
    } catch (error) {
        console.error('Weekly report generation error:', error);
    }
});

// ==================== ヘルスチェック ====================

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(port, () => {
    console.log(`🚀 AIO Checker Pro API server running on port ${port}`);
    console.log(`📊 Dashboard: ${process.env.FRONTEND_URL}`);
    console.log(`⏰ Scheduled checks: Enabled`);
});
