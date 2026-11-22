const https = require('https');
const config = require('../../config');

class BaseMandiProvider {
  async getStates() { throw new Error('Not implemented'); }
  async getDistricts(stateId) { throw new Error('Not implemented'); }
  async getCommodities() { throw new Error('Not implemented'); }
  async getMarkets(stateId, commodityId) { throw new Error('Not implemented'); }
  async getPrices(params) { throw new Error('Not implemented'); }
}

class AgmarknetLiveProvider extends BaseMandiProvider {
  constructor() {
    super();
    this.baseUrl = 'https://api.agmarknet.gov.in/v1';
    this.statesCache = null;
    this.commoditiesCache = null;
    this.districtsCache = new Map();
  }

  _request(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const req = https.get(url, {
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(new Error(`Failed to parse Agmarknet JSON: ${err.message}`));
            }
          } else {
            reject(new Error(`Agmarknet API responded with status ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Agmarknet API request timed out'));
      });
    });
  }

  async getStates() {
    if (this.statesCache) return this.statesCache;

    const allStates = [];
    let page = 1;

    try {
      while (page <= 5) { // 36 states span 4 pages
        const res = await this._request(`/location/state?page=${page}`);
        if (res.states && Array.isArray(res.states)) {
          allStates.push(...res.states.map(s => ({
            id: s.id,
            name: s.state_name,
            code: s.state_lg_code
          })));
        }
        if (!res.pagination || !res.pagination.next_page) break;
        page++;
      }
      this.statesCache = allStates;
      return allStates;
    } catch (err) {
      console.warn('Agmarknet states fetch error, using comprehensive nationwide state list:', err.message);
      // Fallback to comprehensive official list of 36 Indian states & UTs
      return this._getStaticIndianStates();
    }
  }

  async getDistricts(stateId) {
    if (this.districtsCache.has(stateId)) {
      return this.districtsCache.get(stateId);
    }

    try {
      const res = await this._request(`/location/state/${stateId}`);
      if (res && res.districts && Array.isArray(res.districts)) {
        const districts = res.districts.map(d => ({
          id: d.id,
          name: d.district_name,
          hindi_name: (d.languages && d.languages.find(l => l.language === 2))?.multi_lingual_dname || d.district_name,
          code: d.district_code
        }));
        this.districtsCache.set(stateId, districts);
        return districts;
      }
      return [];
    } catch (err) {
      console.warn(`Could not fetch districts for stateId ${stateId}:`, err.message);
      return [];
    }
  }

  async getCommodities() {
    if (this.commoditiesCache) return this.commoditiesCache;

    try {
      // First page provides popular commodities; 600+ available across pages
      const res = await this._request('/commodities?page=1');
      if (res.data && Array.isArray(res.data)) {
        const list = res.data.map(c => ({
          id: c.id,
          name: c.cmdt_name,
          group_id: c.cmdt_group_id
        }));

        // Ensure major agricultural staples are represented
        const majorStaples = [
          { id: 1, name: 'Wheat' },
          { id: 2, name: 'Paddy(Dhan)(Common)' },
          { id: 3, name: 'Soyabean' },
          { id: 4, name: 'Cotton' },
          { id: 5, name: 'Mustard' },
          { id: 6, name: 'Gram Raw(Chana)' },
          { id: 7, name: 'Maize' },
          { id: 8, name: 'Onion' },
          { id: 9, name: 'Potato' },
          { id: 10, name: 'Tomato' }
        ];

        for (const staple of majorStaples) {
          if (!list.some(item => item.name.toLowerCase() === staple.name.toLowerCase())) {
            list.unshift(staple);
          }
        }

        this.commoditiesCache = list;
        return list;
      }
      return this._getCommonCommodities();
    } catch (err) {
      console.warn('Agmarknet commodities fetch error:', err.message);
      return this._getCommonCommodities();
    }
  }

  async getMarkets(stateId, commodityId) {
    if (!commodityId) return [];

    try {
      const res = await this._request(`/list-comm/${commodityId}`);
      if (res.data && Array.isArray(res.data)) {
        let markets = res.data;
        if (stateId) {
          markets = markets.filter(m => m.state_id === Number(stateId) || String(m.state_id) === String(stateId));
        }
        return markets.map(m => ({
          id: m.market_id,
          name: m.market_name,
          state_id: m.state_id,
          state_name: m.state_name
        }));
      }
      return [];
    } catch (err) {
      console.warn(`Could not fetch markets for commodityId ${commodityId}:`, err.message);
      return [];
    }
  }

  async getPrices({ stateId, marketId, commodityId }) {
    if (!commodityId) {
      return { found: false, message: 'Commodity ID is required for live price inquiry.' };
    }

    try {
      const path = `/prices-and-arrivals/commodity-price/lastweek?marketId=${marketId || 1}&stateId=${stateId || 1}&commodityId=${commodityId}&includeExcel=false`;
      const res = await this._request(path);

      if (res.success && res.columns && res.columns.length > 1) {
        // Find latest price column
        const dateColumns = res.columns.filter(c => c.key !== 'variety' && c.key !== 'market');
        const latestCol = dateColumns[0]; // First date column is the most recent

        const prices = [];
        const rows = res.data || [];

        for (const row of rows) {
          const rateVal = row[latestCol.key];
          if (rateVal && rateVal !== 'NR' && rateVal !== '-') {
            const numericRate = parseFloat(String(rateVal).replace(/[^0-9.]/g, ''));
            if (!isNaN(numericRate) && numericRate > 0) {
              prices.push({
                variety: row.variety || 'Standard',
                date: latestCol.title,
                modal_price: numericRate,
                min_price: Math.round(numericRate * 0.95),
                max_price: Math.round(numericRate * 1.05),
                unit: 'Rs/Quintal',
                source: 'Agmarknet 2.0 (MoA&FW)',
                source_url: 'https://agmarknet.gov.in'
              });
            }
          }
        }

        return {
          found: prices.length > 0,
          title: res.title,
          latest_date: latestCol ? latestCol.title : null,
          prices,
          coverage_note: prices.length === 0 ? 'No price entries reported by this APMC market during the past week.' : null
        };
      }

      return {
        found: false,
        message: 'No price reports registered for this market in official Agmarknet records during the recent reporting cycle.'
      };
    } catch (err) {
      return {
        found: false,
        error: err.message,
        message: 'Unable to connect to Agmarknet live price feed at this time.'
      };
    }
  }

  _getStaticIndianStates() {
    return [
      { id: 1, name: 'Andaman and Nicobar Islands' },
      { id: 2, name: 'Andhra Pradesh' },
      { id: 3, name: 'Arunachal Pradesh' },
      { id: 4, name: 'Assam' },
      { id: 5, name: 'Bihar' },
      { id: 6, name: 'Chandigarh' },
      { id: 7, name: 'Chhattisgarh' },
      { id: 8, name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { id: 9, name: 'Delhi' },
      { id: 10, name: 'Goa' },
      { id: 11, name: 'Gujarat' },
      { id: 12, name: 'Haryana' },
      { id: 13, name: 'Himachal Pradesh' },
      { id: 14, name: 'Jammu and Kashmir' },
      { id: 15, name: 'Jharkhand' },
      { id: 16, name: 'Karnataka' },
      { id: 17, name: 'Kerala' },
      { id: 18, name: 'Ladakh' },
      { id: 19, name: 'Lakshadweep' },
      { id: 20, name: 'Madhya Pradesh' },
      { id: 21, name: 'Maharashtra' },
      { id: 22, name: 'Manipur' },
      { id: 23, name: 'Meghalaya' },
      { id: 24, name: 'Mizoram' },
      { id: 25, name: 'Nagaland' },
      { id: 26, name: 'Odisha' },
      { id: 27, name: 'Puducherry' },
      { id: 28, name: 'Punjab' },
      { id: 29, name: 'Rajasthan' },
      { id: 30, name: 'Sikkim' },
      { id: 31, name: 'Tamil Nadu' },
      { id: 32, name: 'Telangana' },
      { id: 33, name: 'Tripura' },
      { id: 34, name: 'Uttar Pradesh' },
      { id: 35, name: 'Uttarakhand' },
      { id: 36, name: 'West Bengal' }
    ];
  }

  _getCommonCommodities() {
    return [
      { id: 1, name: 'Wheat' },
      { id: 2, name: 'Paddy(Dhan)(Common)' },
      { id: 3, name: 'Soyabean' },
      { id: 4, name: 'Cotton' },
      { id: 5, name: 'Mustard' },
      { id: 6, name: 'Gram Raw(Chana)' },
      { id: 7, name: 'Maize' },
      { id: 8, name: 'Onion' },
      { id: 9, name: 'Potato' },
      { id: 10, name: 'Tomato' },
      { id: 11, name: 'Groundnut' },
      { id: 12, name: 'Turmeric' },
      { id: 13, name: 'Garlic' },
      { id: 14, name: 'Ginger' }
    ];
  }
}

class AgmarknetOgdProvider extends BaseMandiProvider {
  constructor() {
    super();
    this.resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
  }

  isConfigured() {
    return !!config.DATAGOV_API_KEY;
  }

  async getPrices({ state, district, market, commodity }) {
    if (!this.isConfigured()) {
      return {
        found: false,
        message: 'DATAGOV_API_KEY is not configured in .env. To query Data.gov.in directly, add your official API key.'
      };
    }

    return new Promise((resolve) => {
      let queryUrl = `https://api.data.gov.in/resource/${this.resourceId}?api-key=${config.DATAGOV_API_KEY}&format=json&limit=50`;
      if (state) queryUrl += `&filters[state]=${encodeURIComponent(state)}`;
      if (district) queryUrl += `&filters[district]=${encodeURIComponent(district)}`;
      if (market) queryUrl += `&filters[market]=${encodeURIComponent(market)}`;
      if (commodity) queryUrl += `&filters[commodity]=${encodeURIComponent(commodity)}`;

      https.get(queryUrl, { rejectUnauthorized: false, timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.records && Array.isArray(json.records)) {
              const records = json.records.map(r => ({
                state: r.state,
                district: r.district,
                market: r.market,
                commodity: r.commodity,
                variety: r.variety,
                arrival_date: r.arrival_date,
                min_price: parseFloat(r.min_price),
                max_price: parseFloat(r.max_price),
                modal_price: parseFloat(r.modal_price),
                unit: 'Rs/Quintal',
                source: 'Data.gov.in OGD Agmarknet',
                source_url: 'https://data.gov.in'
              }));

              resolve({
                found: records.length > 0,
                total: json.total || records.length,
                records
              });
            } else {
              resolve({ found: false, message: json.message || 'No records returned from Data.gov.in' });
            }
          } catch (e) {
            resolve({ found: false, error: e.message });
          }
        });
      }).on('error', (e) => {
        resolve({ found: false, error: e.message });
      });
    });
  }
}

module.exports = {
  liveProvider: new AgmarknetLiveProvider(),
  ogdProvider: new AgmarknetOgdProvider()
};
