const API_BASE = 'http://localhost:5000/api';

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  async getUpdates(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/updates${q ? '?' + q : ''}`);
    return await res.json();
  },

  async runIngestion() {
    const res = await fetch(`${API_BASE}/admin/ingestion/run`, { method: 'POST' });
    return await res.json();
  },

  async getIngestionStatus() {
    const res = await fetch(`${API_BASE}/admin/ingestion/status`);
    return await res.json();
  },

  async sendChatMessage(query) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return await res.json();
  },

  async getMandiStates() {
    const res = await fetch(`${API_BASE}/mandi/states`);
    return await res.json();
  },

  async getMandiDistricts(stateId) {
    const res = await fetch(`${API_BASE}/mandi/districts?stateId=${stateId}`);
    return await res.json();
  },

  async getMandiCommodities() {
    const res = await fetch(`${API_BASE}/mandi/commodities`);
    return await res.json();
  },

  async getMandiMarkets(stateId, commodityId) {
    const res = await fetch(`${API_BASE}/mandi/markets?stateId=${stateId}&commodityId=${commodityId}`);
    return await res.json();
  },

  async getMandiPrices(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/mandi/prices?${q}`);
    return await res.json();
  },

  async getAlertPreferences(userId = 'default_farmer') {
    const res = await fetch(`${API_BASE}/alerts/preferences/${userId}`);
    return await res.json();
  },

  async saveAlertPreferences(userId = 'default_farmer', data) {
    const res = await fetch(`${API_BASE}/alerts/preferences/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};
