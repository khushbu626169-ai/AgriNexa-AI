const crypto = require('crypto');
const db = require('../db');

class AlertService {
  getPreferences(userId) {
    const pref = db.get('SELECT * FROM alert_preferences WHERE user_id = ?', [userId]);
    if (!pref) return null;
    return {
      ...pref,
      states: pref.states ? JSON.parse(pref.states) : [],
      districts: pref.districts ? JSON.parse(pref.districts) : [],
      crops: pref.crops ? JSON.parse(pref.crops) : [],
      schemes_enabled: Boolean(pref.schemes_enabled),
      vacancies_enabled: Boolean(pref.vacancies_enabled),
      consent_given: Boolean(pref.consent_given)
    };
  }

  savePreferences(userId, data) {
    const existing = db.get('SELECT id FROM alert_preferences WHERE user_id = ?', [userId]);
    const now = new Date().toISOString();

    const statesJson = JSON.stringify(data.states || []);
    const districtsJson = JSON.stringify(data.districts || []);
    const cropsJson = JSON.stringify(data.crops || []);
    const schemesVal = data.schemes_enabled !== false ? 1 : 0;
    const vacanciesVal = data.vacancies_enabled !== false ? 1 : 0;
    const consentVal = data.consent_given ? 1 : 0;
    const channel = data.channel || 'in_app';
    const lang = data.preferred_language || 'hi';

    if (existing) {
      db.run(
        `UPDATE alert_preferences 
         SET user_name = ?, contact = ?, channel = ?, preferred_language = ?, states = ?, districts = ?, crops = ?, schemes_enabled = ?, vacancies_enabled = ?, consent_given = ?, updated_at = ?
         WHERE user_id = ?`,
        [data.user_name || null, data.contact || null, channel, lang, statesJson, districtsJson, cropsJson, schemesVal, vacanciesVal, consentVal, now, userId]
      );
    } else {
      const id = crypto.randomUUID();
      db.run(
        `INSERT INTO alert_preferences (id, user_id, user_name, contact, channel, preferred_language, states, districts, crops, schemes_enabled, vacancies_enabled, consent_given, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, data.user_name || null, data.contact || null, channel, lang, statesJson, districtsJson, cropsJson, schemesVal, vacanciesVal, consentVal, now, now]
      );
    }

    return this.getPreferences(userId);
  }

  checkMatchingAlerts(newUpdate) {
    // Finds preferences that match a newly ingested scheme or vacancy
    const allPreferences = db.query('SELECT * FROM alert_preferences WHERE consent_given = 1');
    const matches = [];

    for (const pref of allPreferences) {
      if (newUpdate.category === 'scheme' && !pref.schemes_enabled) continue;
      if (newUpdate.category === 'farmer_vacancy' && !pref.vacancies_enabled) continue;

      const userStates = pref.states ? JSON.parse(pref.states) : [];
      if (userStates.length > 0 && newUpdate.state_applicability !== 'All-India') {
        if (!userStates.includes(newUpdate.state_applicability)) continue;
      }

      matches.push({
        user_id: pref.user_id,
        channel: pref.channel,
        language: pref.preferred_language,
        update_id: newUpdate.id,
        title: newUpdate.title
      });
    }

    return matches;
  }
}

module.exports = new AlertService();
