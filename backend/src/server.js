const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');
const schedulerService = require('./services/schedulerService');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.PORT, () => {
    console.log(`===============================================`);
    console.log(` AgriNexa AI Backend running on port ${config.PORT}`);
    console.log(` Environment: ${config.NODE_ENV}`);
    console.log(` Primary DB: SQLite (WAL mode, native Node 24)`);
    console.log(` LLM Provider: ${config.LLM_PROVIDER}`);
    console.log(`===============================================`);

    // Start background automated ingestion scheduler
    schedulerService.start();
  });
}

module.exports = { app, server };
