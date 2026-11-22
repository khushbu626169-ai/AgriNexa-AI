const alertService = require('../services/alertService');

class AlertsController {
  getPreferences(req, res) {
    try {
      const { userId } = req.params;
      const pref = alertService.getPreferences(userId);
      return res.json({ success: true, data: pref || null });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  savePreferences(req, res) {
    try {
      const { userId } = req.params;
      const data = req.body;
      const saved = alertService.savePreferences(userId, data);
      return res.json({ success: true, data: saved });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AlertsController();
