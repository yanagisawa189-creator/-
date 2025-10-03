import { Pool } from 'pg';

let pool: Pool;

export const connectDB = async (): Promise<void> => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    await createTables();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const getDB = (): Pool => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

const createTables = async (): Promise<void> => {
  const client = pool.connect();
  
  try {
    await (await client).query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) CHECK (user_type IN ('sales_company', 'decision_maker')) NOT NULL,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        description TEXT,
        website VARCHAR(255),
        employees INTEGER,
        target_industries TEXT[],
        services TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS decision_makers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        position VARCHAR(100) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        company_size VARCHAR(50),
        interests TEXT[],
        budget VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS match_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sales_company_id UUID REFERENCES sales_companies(id) ON DELETE CASCADE,
        decision_maker_id UUID REFERENCES decision_makers(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_sales_companies_industry ON sales_companies(industry);
      CREATE INDEX IF NOT EXISTS idx_decision_makers_industry ON decision_makers(industry);
      CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status);
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    (await client).release();
  }
};