const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const RankingChecker = require('./services/rankingChecker');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/screenshots', express.static(path.join(__dirname, '..', 'screenshots')));
app.use('/reports', express.static(path.join(__dirname, '..', 'reports')));

// In-memory storage (PostgreSQL代替)
let users = [];
let companies = [];
let checkResults = [];
let rankingHistory = []; // 順位履歴
let authToken = null;

// サービスインスタンス
const rankingChecker = new RankingChecker();

// JWT生成（簡易版）
function generateToken(userId) {
    return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64');
}

// 認証ミドルウェア（簡易版）
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decoded.exp < Date.now()) {
            return res.status(403).json({ error: 'Token expired' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// ==================== 認証API ====================

/**
 * ユーザー登録
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, company_name, plan } = req.body;

        const userId = Date.now().toString();
        const user = {
            id: userId,
            email,
            company_name,
            plan: plan || 'basic',
            created_at: new Date().toISOString()
        };

        users.push(user);
        const token = generateToken(userId);

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

        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id);

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
        const userCompanies = companies.filter(c => c.user_id === req.user.userId);
        res.json(userCompanies);
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
        const { name, domain, industry, manager, memo, keywords } = req.body;

        const company = {
            id: Date.now().toString(),
            user_id: req.user.userId,
            name,
            domain,
            industry,
            manager,
            memo,
            keywords: keywords || [],
            created_at: new Date().toISOString()
        };

        companies.push(company);
        res.json(company);
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
        const { keywords } = req.body;

        const company = companies.find(c => c.id === companyId && c.user_id === req.user.userId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        company.keywords = [...(company.keywords || []), ...keywords];
        res.json({ success: true, keywords: company.keywords });
    } catch (error) {
        console.error('Add keywords error:', error);
        res.status(500).json({ error: 'Failed to add keywords' });
    }
});

// ==================== AIOチェックAPI ====================

/**
 * AIOチェック実行（デモ版）
 */
app.post('/api/check/run', authenticateToken, async (req, res) => {
    try {
        const { companyId, keywords } = req.body;

        const company = companies.find(c => c.id === companyId && c.user_id === req.user.userId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // デモデータ生成
        const results = [];
        const llmTypes = ['ChatGPT', 'Claude', 'Gemini', 'Google AIO'];

        for (const keyword of keywords) {
            for (const llmType of llmTypes) {
                const result = {
                    id: Date.now().toString() + Math.random(),
                    company_id: companyId,
                    keyword,
                    llm_type: llmType,
                    is_cited: Math.random() > 0.6,
                    citation_text: Math.random() > 0.6 ? `${company.name}の${keyword}に関する情報` : null,
                    screenshot_path: null,
                    raw_response: `${llmType}での${keyword}の検索結果（デモ）`,
                    status: 'completed',
                    check_date: new Date().toISOString()
                };
                results.push(result);
                checkResults.push(result);
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

        let results = checkResults.filter(r => {
            const company = companies.find(c => c.id === r.company_id);
            return company && company.user_id === req.user.userId;
        });

        if (companyId) {
            results = results.filter(r => r.company_id === companyId);
        }

        if (startDate && endDate) {
            results = results.filter(r => {
                const checkDate = new Date(r.check_date);
                return checkDate >= new Date(startDate) && checkDate <= new Date(endDate);
            });
        }

        // 企業情報を追加
        const enrichedResults = results.map(r => {
            const company = companies.find(c => c.id === r.company_id);
            return {
                ...r,
                company_name: company?.name || 'Unknown'
            };
        });

        res.json(enrichedResults);
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// ==================== 順位チェックAPI ====================

/**
 * 順位チェック実行
 */
app.post('/api/ranking/check', authenticateToken, async (req, res) => {
    try {
        const { companyId, keywords, domain } = req.body;

        if (!keywords || keywords.length === 0) {
            return res.status(400).json({ error: 'Keywords are required' });
        }

        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        const company = companies.find(c => c.id === companyId && c.user_id === req.user.userId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // 順位チェック実行
        console.log(`Checking rankings for ${domain} with keywords:`, keywords);
        const results = await rankingChecker.checkMultipleRankings(keywords, domain);

        // 履歴に保存
        results.forEach(result => {
            const historyEntry = {
                id: Date.now().toString() + Math.random(),
                company_id: companyId,
                user_id: req.user.userId,
                ...result
            };
            rankingHistory.push(historyEntry);
        });

        res.json({ success: true, results });
    } catch (error) {
        console.error('Ranking check error:', error);
        res.status(500).json({ error: error.message || 'Ranking check failed' });
    }
});

/**
 * 順位履歴取得
 */
app.get('/api/ranking/history', authenticateToken, async (req, res) => {
    try {
        const { companyId, keyword, days } = req.query;

        let history = rankingHistory.filter(h => h.user_id === req.user.userId);

        if (companyId) {
            history = history.filter(h => h.company_id === companyId);
        }

        if (keyword) {
            history = history.filter(h => h.keyword === keyword);
        }

        if (days) {
            const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
            history = history.filter(h => new Date(h.searchDate) >= daysAgo);
        }

        // 日付降順でソート
        history.sort((a, b) => new Date(b.searchDate) - new Date(a.searchDate));

        res.json(history);
    } catch (error) {
        console.error('Get ranking history error:', error);
        res.status(500).json({ error: 'Failed to fetch ranking history' });
    }
});

/**
 * 順位トレンド分析
 */
app.get('/api/ranking/trend', authenticateToken, async (req, res) => {
    try {
        const { companyId, keyword } = req.query;

        if (!companyId || !keyword) {
            return res.status(400).json({ error: 'Company ID and keyword are required' });
        }

        const history = rankingHistory.filter(h =>
            h.user_id === req.user.userId &&
            h.company_id === companyId &&
            h.keyword === keyword &&
            h.ranking !== null
        );

        const trend = rankingChecker.analyzeTrend(history);

        res.json({
            keyword,
            trend,
            dataPoints: history.length,
            history: history.slice(0, 10) // 最新10件のみ返す
        });
    } catch (error) {
        console.error('Get ranking trend error:', error);
        res.status(500).json({ error: 'Failed to analyze trend' });
    }
});

// ==================== レポートAPI ====================

/**
 * 週次レポート生成（デモ版）
 */
app.post('/api/reports/weekly', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.body;

        const company = companies.find(c => c.id === companyId && c.user_id === req.user.userId);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const results = checkResults.filter(r =>
            r.company_id === companyId && new Date(r.check_date) >= weekAgo
        );

        const reportPath = `reports/weekly-${companyId}-${Date.now()}.pdf`;

        res.json({
            success: true,
            reportPath,
            summary: {
                total_checks: results.length,
                citations_found: results.filter(r => r.is_cited).length,
                report_date: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// ==================== ヘルスチェック ====================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        users: users.length,
        companies: companies.length,
        results: checkResults.length
    });
});

// ダッシュボード配信
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'aio-checker-dashboard-v2.html'));
});

// サーバー起動
app.listen(port, () => {
    console.log(`🚀 AIO Checker Pro API server running on http://localhost:${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}`);
    console.log(`💡 Mode: In-Memory Storage (No Database)`);
    console.log(`⏰ Scheduled checks: Disabled (Demo Mode)`);
});
