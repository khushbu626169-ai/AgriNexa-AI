const express = require('express');
const router = express.Router();

const updatesController = require('../controllers/updatesController');
const mandiController = require('../controllers/mandiController');
const chatController = require('../controllers/chatController');
const alertsController = require('../controllers/alertsController');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AgriNexa AI Platform',
    timestamp: new Date().toISOString()
  });
});

// Updates & Schemes / Vacancies
router.get('/updates', (req, res) => updatesController.getUpdates(req, res));
router.get('/updates/latest', (req, res) => updatesController.getLatestUpdates(req, res));
router.get('/updates/:id', (req, res) => updatesController.getUpdateById(req, res));
router.post('/admin/ingestion/run', (req, res) => updatesController.runIngestion(req, res));
router.get('/admin/ingestion/status', (req, res) => updatesController.getIngestionStatus(req, res));

// Mandi Price Search
router.get('/mandi/states', (req, res) => mandiController.getStates(req, res));
router.get('/mandi/districts', (req, res) => mandiController.getDistricts(req, res));
router.get('/mandi/crops', (req, res) => mandiController.getCommodities(req, res));
router.get('/mandi/commodities', (req, res) => mandiController.getCommodities(req, res));
router.get('/mandi/markets', (req, res) => mandiController.getMarkets(req, res));
router.get('/mandi/prices', (req, res) => mandiController.getPrices(req, res));

// RAG Chat
router.post('/chat', (req, res) => chatController.handleMessage(req, res));

// Alert Preferences
router.get('/alerts/preferences/:userId', (req, res) => alertsController.getPreferences(req, res));
router.post('/alerts/preferences/:userId', (req, res) => alertsController.savePreferences(req, res));

module.exports = router;
