const crypto = require('crypto');
const db = require('../../db');
const { liveProvider, ogdProvider } = require('./mandiProviders');
const config = require('../../config');

class MandiSearchService {
  constructor() {
    this.cacheTtlMs = config.MANDI_CACHE_TTL_MS;
  }

  async getStates() {
    return await liveProvider.getStates();
  }

  async getDistricts(stateId) {
    if (!stateId) return [];
    return await liveProvider.getDistricts(stateId);
  }

  async getCommodities() {
    return await liveProvider.getCommodities();
  }

  async getMarkets(stateId, commodityId) {
    return await liveProvider.getMarkets(stateId, commodityId);
  }

  async getPrices({ state, district, market, crop, date, stateId, marketId, commodityId }) {
    // 1. Resolve commodity and state IDs if string names passed
    const commodities = await this.getCommodities();
    let resolvedCommodity = commodities.find(c => 
      c.id === Number(commodityId) || 
      (crop && c.name.toLowerCase().includes(crop.toLowerCase()))
    );

    if (!resolvedCommodity && crop) {
      // Fuzzy name matching for Hindi/common names
      const synonyms = {
        'gehun': 'Wheat', 'gehu': 'Wheat', 'chawal': 'Paddy', 'dhan': 'Paddy',
        'sarson': 'Mustard', 'rai': 'Mustard', 'kapas': 'Cotton', 'chana': 'Gram Raw(Chana)',
        'pyaz': 'Onion', 'kanda': 'Onion', 'aloo': 'Potato', 'tamatar': 'Tomato',
        'makka': 'Maize', 'makai': 'Maize'
      };
      const syn = synonyms[crop.toLowerCase().trim()];
      if (syn) {
        resolvedCommodity = commodities.find(c => c.name.toLowerCase().includes(syn.toLowerCase()));
      }
    }

    const cId = resolvedCommodity ? resolvedCommodity.id : (commodityId || 1);
    const cropName = resolvedCommodity ? resolvedCommodity.name : (crop || 'Wheat');

    // 2. Resolve state
    const states = await this.getStates();
    let resolvedState = states.find(s => 
      s.id === Number(stateId) || 
      (state && s.name.toLowerCase().includes(state.toLowerCase()))
    );
    const sId = resolvedState ? resolvedState.id : (stateId || 1);
    const stateName = resolvedState ? resolvedState.name : (state || 'All-India');

    // 3. Check local database cache
    const cached = db.query(
      `SELECT * FROM mandi_prices 
       WHERE (commodity LIKE ? OR commodity = ?)
       AND (state LIKE ? OR state = ?)
       ORDER BY arrival_date DESC LIMIT 10`,
      [`%${cropName}%`, cropName, `%${stateName}%`, stateName]
    );

    if (cached && cached.length > 0) {
      const latestCacheTime = new Date(cached[0].cached_at).getTime();
      if (Date.now() - latestCacheTime < this.cacheTtlMs) {
        return {
          found: true,
          source_type: 'cached_official',
          commodity: cropName,
          state: stateName,
          market: market || cached[0].market,
          prices: cached.map(r => ({
            variety: r.variety,
            grade: r.grade,
            arrival_date: r.arrival_date,
            min_price: r.min_price,
            max_price: r.max_price,
            modal_price: r.modal_price,
            unit: r.unit,
            source: r.source,
            source_url: r.source_url
          }))
        };
      }
    }

    // 4. Check OGD Provider if key configured and user requested exact district/market
    if (ogdProvider.isConfigured() && (state || district || market)) {
      const ogdResult = await ogdProvider.getPrices({ state, district, market, commodity: cropName });
      if (ogdResult.found && ogdResult.records && ogdResult.records.length > 0) {
        this._cacheRecords(ogdResult.records);
        return {
          found: true,
          source_type: 'ogd_data_gov_in',
          commodity: cropName,
          state: stateName,
          prices: ogdResult.records
        };
      }
    }

    // 5. Query official Agmarknet Live Provider
    const liveResult = await liveProvider.getPrices({
      stateId: sId,
      marketId: marketId || 1,
      commodityId: cId
    });

    if (liveResult.found && liveResult.prices && liveResult.prices.length > 0) {
      // Record into SQLite
      const now = new Date().toISOString();
      const recordsToCache = liveResult.prices.map(p => ({
        id: crypto.randomUUID(),
        state: stateName,
        district: district || 'Major District',
        market: market || 'Primary APMC',
        commodity: cropName,
        variety: p.variety,
        grade: 'Standard',
        arrival_date: p.date,
        min_price: p.min_price,
        max_price: p.max_price,
        modal_price: p.modal_price,
        unit: p.unit,
        source: p.source,
        source_url: p.source_url,
        cached_at: now,
        created_at: now
      }));

      for (const rec of recordsToCache) {
        db.run(
          `INSERT INTO mandi_prices (id, state, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price, unit, source, source_url, cached_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rec.id, rec.state, rec.district, rec.market, rec.commodity, rec.variety, rec.grade, rec.arrival_date, rec.min_price, rec.max_price, rec.modal_price, rec.unit, rec.source, rec.source_url, rec.cached_at, rec.created_at]
        );
      }

      return {
        found: true,
        source_type: 'agmarknet_live',
        commodity: cropName,
        state: stateName,
        market: market || 'Selected APMC',
        prices: liveResult.prices,
        title: liveResult.title
      };
    }

    // 6. Honest coverage response when no price report exists (per README section 5)
    // Build available markets for this commodity so farmer can explore nearby options
    const availableMarkets = await liveProvider.getMarkets(sId, cId);

    return {
      found: false,
      commodity: cropName,
      state: stateName,
      market: market || 'Selected APMC',
      message: `No price or arrival entries reported for ${cropName} in ${market ? market + ' (' + stateName + ')' : stateName} during the current Agmarknet reporting period.`,
      official_source: 'Directorate of Marketing & Inspection (DMI), Agmarknet',
      official_url: 'https://agmarknet.gov.in',
      nearby_or_reporting_markets: availableMarkets.slice(0, 8).map(m => m.name),
      suggestion: availableMarkets.length > 0 
        ? `You can check alternative reporting markets in ${stateName}: ${availableMarkets.slice(0, 4).map(m => m.name).join(', ')}.`
        : `Check the official Agmarknet portal directly or try searching for another major agricultural commodity.`
    };
  }
}

module.exports = new MandiSearchService();
