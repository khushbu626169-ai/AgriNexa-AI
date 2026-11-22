const mandiSearchService = require('../services/mandi/mandiSearchService');

class MandiController {
  async getStates(req, res) {
    try {
      const states = await mandiSearchService.getStates();
      return res.json({ success: true, data: states });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getDistricts(req, res) {
    try {
      const stateId = req.query.stateId || req.query.state;
      const districts = await mandiSearchService.getDistricts(stateId);
      return res.json({ success: true, data: districts });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getCommodities(req, res) {
    try {
      const commodities = await mandiSearchService.getCommodities();
      return res.json({ success: true, data: commodities });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMarkets(req, res) {
    try {
      const { stateId, commodityId } = req.query;
      const markets = await mandiSearchService.getMarkets(stateId, commodityId);
      return res.json({ success: true, data: markets });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getPrices(req, res) {
    try {
      const { state, district, market, crop, date, stateId, marketId, commodityId } = req.query;
      const result = await mandiSearchService.getPrices({
        state,
        district,
        market,
        crop,
        date,
        stateId,
        marketId,
        commodityId
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new MandiController();
