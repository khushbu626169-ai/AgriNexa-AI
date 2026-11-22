const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

// Ensure database directory exists
const dbDir = path.dirname(config.SQLITE_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqliteDb = new DatabaseSync(config.SQLITE_DB_PATH);

// Enable WAL mode for high concurrency
sqliteDb.exec('PRAGMA journal_mode = WAL;');
sqliteDb.exec('PRAGMA synchronous = NORMAL;');

function initSchema() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL, -- 'scheme', 'farmer_vacancy', 'agri_service'
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      canonical_url TEXT NOT NULL UNIQUE,
      content_hash TEXT NOT NULL,
      announcement_date TEXT,
      last_verified TEXT NOT NULL,
      state_applicability TEXT NOT NULL DEFAULT 'All-India',
      district_applicability TEXT,
      eligibility TEXT,
      benefits TEXT,
      application_window TEXT,
      application_deadline TEXT,
      application_link TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'upcoming', 'closed', 'unknown'
      relevance_score REAL NOT NULL DEFAULT 1.0,
      relevance_reason TEXT,
      raw_source TEXT,
      embedding TEXT, -- JSON array of floats for vector search
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_updates_category ON updates(category);
    CREATE INDEX IF NOT EXISTS idx_updates_state ON updates(state_applicability);
    CREATE INDEX IF NOT EXISTS idx_updates_status ON updates(status);
    CREATE INDEX IF NOT EXISTS idx_updates_date ON updates(announcement_date);
    CREATE INDEX IF NOT EXISTS idx_updates_canonical ON updates(canonical_url);

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      official_domain TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'api', 'rss', 'html', 'pdf'
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      polling_frequency TEXT NOT NULL DEFAULT 'daily',
      last_run TEXT,
      last_status TEXT, -- 'success', 'failed', 'running'
      last_item_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mandi_prices (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      market TEXT NOT NULL,
      commodity TEXT NOT NULL,
      variety TEXT DEFAULT 'FAQ',
      grade TEXT DEFAULT 'Standard',
      arrival_date TEXT NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      modal_price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Rs/Quintal',
      source TEXT NOT NULL DEFAULT 'Agmarknet',
      source_url TEXT,
      cached_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mandi_lookup ON mandi_prices(state, district, market, commodity);
    CREATE INDEX IF NOT EXISTS idx_mandi_commodity ON mandi_prices(commodity);
    CREATE INDEX IF NOT EXISTS idx_mandi_date ON mandi_prices(arrival_date);

    CREATE TABLE IF NOT EXISTS ingestion_logs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL, -- 'running', 'completed', 'failed'
      items_fetched INTEGER DEFAULT 0,
      items_accepted INTEGER DEFAULT 0,
      items_rejected INTEGER DEFAULT 0,
      items_quarantined INTEGER DEFAULT 0,
      details TEXT,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS alert_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT,
      contact TEXT,
      channel TEXT NOT NULL DEFAULT 'in_app', -- 'in_app', 'email', 'sms'
      preferred_language TEXT NOT NULL DEFAULT 'hi',
      states TEXT, -- JSON array
      districts TEXT, -- JSON array
      crops TEXT, -- JSON array
      schemes_enabled INTEGER NOT NULL DEFAULT 1,
      vacancies_enabled INTEGER NOT NULL DEFAULT 1,
      consent_given INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_user ON alert_preferences(user_id);
  `);
}

initSchema();

module.exports = {
  db: sqliteDb,
  query(sql, params = []) {
    return sqliteDb.prepare(sql).all(...params);
  },
  get(sql, params = []) {
    return sqliteDb.prepare(sql).get(...params);
  },
  run(sql, params = []) {
    return sqliteDb.prepare(sql).run(...params);
  },
  exec(sql) {
    return sqliteDb.exec(sql);
  }
};
