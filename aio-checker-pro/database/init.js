const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');

        const schemaSQL = fs.readFileSync(
            path.join(__dirname, 'schema.sql'),
            'utf8'
        );

        await pool.query(schemaSQL);

        console.log('✅ Database initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initDatabase();
