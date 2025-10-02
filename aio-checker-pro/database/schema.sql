-- AIO Checker Pro Database Schema

-- Users Table (顧客アカウント)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table (監視対象企業)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    manager VARCHAR(255),
    memo TEXT,
    ga4_property_id VARCHAR(100),
    ga4_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keywords Table (対策キーワード)
CREATE TABLE IF NOT EXISTS keywords (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check Results Table (チェック結果)
CREATE TABLE IF NOT EXISTS check_results (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
    llm_type VARCHAR(50) NOT NULL, -- 'chatgpt', 'gemini', 'claude', 'google_aio'
    check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_cited BOOLEAN DEFAULT false,
    citation_text TEXT,
    citation_position INTEGER,
    serp_rank INTEGER,
    screenshot_path VARCHAR(500),
    raw_response TEXT,
    status VARCHAR(50) DEFAULT 'success'
);

-- Citations Table (引用詳細)
CREATE TABLE IF NOT EXISTS citations (
    id SERIAL PRIMARY KEY,
    check_result_id INTEGER REFERENCES check_results(id) ON DELETE CASCADE,
    cited_url VARCHAR(500),
    citation_context TEXT,
    confidence_score FLOAT
);

-- Competitors Table (競合他社)
CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_domain VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules Table (定期実行スケジュール)
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    time VARCHAR(10) NOT NULL, -- 'HH:MM' format
    enabled BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table (通知履歴)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_citation', 'citation_lost', 'rank_change'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table (レポート履歴)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
    report_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Table (API利用状況)
CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    api_type VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'serp'
    usage_count INTEGER DEFAULT 1,
    cost_estimate DECIMAL(10, 4),
    usage_date DATE DEFAULT CURRENT_DATE
);

-- Indexes for performance
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_keywords_company_id ON keywords(company_id);
CREATE INDEX idx_check_results_company_id ON check_results(company_id);
CREATE INDEX idx_check_results_date ON check_results(check_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_api_usage_user_date ON api_usage(user_id, usage_date);
