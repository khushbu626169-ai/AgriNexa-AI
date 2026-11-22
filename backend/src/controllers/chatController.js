const chatService = require('../services/chatService');

class ChatController {
  async handleMessage(req, res) {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Query text is required' });
      }

      const result = await chatService.processMessage(query.trim());
      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ChatController();
