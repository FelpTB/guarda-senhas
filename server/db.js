const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      visibility VARCHAR(20) NOT NULL DEFAULT 'personal',
      service VARCHAR(255),
      username VARCHAR(255),
      password TEXT,
      key TEXT,
      connection_string TEXT,
      title VARCHAR(255),
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS entry_permissions (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      granted_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(entry_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_entries_visibility ON entries(visibility);
    CREATE INDEX IF NOT EXISTS idx_entry_permissions_user ON entry_permissions(user_id);
  `);
}

module.exports = { pool, initDb };
