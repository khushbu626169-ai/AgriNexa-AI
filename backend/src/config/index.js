const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/agrinexa.db'),
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini', // 'gemini', 'openai', or 'local_heuristic'
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  DATAGOV_API_KEY: process.env.DATAGOV_API_KEY || '',
  INGESTION_CRON_SCHEDULE: process.env.INGESTION_CRON_SCHEDULE || '0 */4 * * *', // every 4 hours
  INGESTION_RUN_ON_STARTUP: process.env.INGESTION_RUN_ON_STARTUP === 'true' || true,
  MANDI_CACHE_TTL_MS: parseInt(process.env.MANDI_CACHE_TTL_MS || '3600000', 10), // 1 hour
};
