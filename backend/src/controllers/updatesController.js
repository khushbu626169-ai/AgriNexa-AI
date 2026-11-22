const db = require('../db');
const updateIngestionService = require('../services/updateIngestionService');
const sourceRegistry = require('../services/sourceRegistry');
const schedulerService = require('../services/schedulerService');

class UpdatesController {
  getUpdates(req, res) {
    try {
      const { category, state, status, search, page = 1, limit = 20 } = req.query;
      const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

      let sql = 'SELECT * FROM updates WHERE 1=1';
      const params = [];

      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (state && state !== 'All-India') {
        sql += " AND (state_applicability = ? OR state_applicability = 'All-India')";
        params.push(state);
      }
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        sql += ' AND (title LIKE ? OR summary LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Count total
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countRes = db.get(countSql, params);
      const total = countRes ? countRes.total : 0;

      sql += ' ORDER BY announcement_date DESC, created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), offset);

      const items = db.query(sql, params).map(item => {
        // Don't leak raw embedding vectors to standard list UI
        const { embedding, ...rest } = item;
        return rest;
      });

      return res.json({
        success: true,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total_pages: Math.ceil(total / parseInt(limit, 10)),
        data: items
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  getUpdateById(req, res) {
    try {
      const item = db.get('SELECT * FROM updates WHERE id = ?', [req.params.id]);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Update not found' });
      }
      const { embedding, ...rest } = item;
      return res.json({ success: true, data: rest });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  getLatestUpdates(req, res) {
    try {
      const limit = parseInt(req.query.limit || '6', 10);
      const items = db.query('SELECT * FROM updates ORDER BY created_at DESC LIMIT ?', [limit]).map(item => {
        const { embedding, ...rest } = item;
        return rest;
      });
      return res.json({ success: true, data: items });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async runIngestion(req, res) {
    try {
      const result = await updateIngestionService.runAllSources();
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  getIngestionStatus(req, res) {
    try {
      const schedulerStatus = schedulerService.getStatus();
      const sources = sourceRegistry.getAllSources();
      const recentLogs = updateIngestionService.getRecentLogs(10);

      return res.json({
        success: true,
        scheduler: schedulerStatus,
        sources,
        recent_logs: recentLogs
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new UpdatesController();
