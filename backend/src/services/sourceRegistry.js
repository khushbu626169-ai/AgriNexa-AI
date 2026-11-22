const db = require('../db');

const INITIAL_SOURCES = [
  {
    id: 'pmkisan_official',
    name: 'PM-KISAN Portal (Ministry of Agriculture & Farmers Welfare)',
    official_domain: 'pmkisan.gov.in',
    source_type: 'html',
    url: 'https://pmkisan.gov.in',
    category: 'scheme',
    polling_frequency: 'daily',
    enabled: 1
  },
  {
    id: 'pmfby_crop_insurance',
    name: 'PMFBY - Pradhan Mantri Fasal Bima Yojana',
    official_domain: 'fasalvima.gov.in',
    source_type: 'html',
    url: 'https://fasalvima.gov.in',
    category: 'scheme',
    polling_frequency: 'daily',
    enabled: 1
  },
  {
    id: 'agricoop_schemes',
    name: 'Department of Agriculture & Farmers Welfare (DA&FW)',
    official_domain: 'agricoop.nic.in',
    source_type: 'html',
    url: 'https://agricoop.nic.in',
    category: 'scheme',
    polling_frequency: 'daily',
    enabled: 1
  },
  {
    id: 'icar_vacancies',
    name: 'ICAR - Indian Council of Agricultural Research (Career & Opportunities)',
    official_domain: 'icar.org.in',
    source_type: 'html',
    url: 'https://icar.org.in/career/vacancies',
    category: 'farmer_vacancy',
    polling_frequency: 'daily',
    enabled: 1
  },
  {
    id: 'asrb_agri_jobs',
    name: 'ASRB - Agricultural Scientists Recruitment Board',
    official_domain: 'asrb.org.in',
    source_type: 'html',
    url: 'https://asrb.org.in',
    category: 'farmer_vacancy',
    polling_frequency: 'daily',
    enabled: 1
  },
  {
    id: 'myscheme_agri',
    name: 'MyScheme National Portal - Agriculture & Rural Schemes',
    official_domain: 'myscheme.gov.in',
    source_type: 'api',
    url: 'https://www.myscheme.gov.in',
    category: 'scheme',
    polling_frequency: 'daily',
    enabled: 1
  }
];

class SourceRegistry {
  constructor() {
    this.seedSources();
  }

  seedSources() {
    const now = new Date().toISOString();
    const existing = db.query('SELECT id FROM sources');
    const existingIds = new Set(existing.map(s => s.id));

    for (const src of INITIAL_SOURCES) {
      if (!existingIds.has(src.id)) {
        db.run(
          `INSERT INTO sources (id, name, official_domain, source_type, url, category, enabled, polling_frequency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [src.id, src.name, src.official_domain, src.source_type, src.url, src.category, src.enabled, src.polling_frequency, now, now]
        );
      }
    }
  }

  getAllSources() {
    return db.query('SELECT * FROM sources ORDER BY name ASC');
  }

  getEnabledSources() {
    return db.query('SELECT * FROM sources WHERE enabled = 1');
  }

  getSourceById(id) {
    return db.get('SELECT * FROM sources WHERE id = ?', [id]);
  }

  updateSourceStatus(id, status, itemCount = 0, errorMessage = null) {
    const now = new Date().toISOString();
    db.run(
      `UPDATE sources 
       SET last_run = ?, last_status = ?, last_item_count = ?, last_error = ?, updated_at = ?
       WHERE id = ?`,
      [now, status, itemCount, errorMessage, now, id]
    );
  }

  toggleSource(id, enabled) {
    const now = new Date().toISOString();
    db.run('UPDATE sources SET enabled = ?, updated_at = ? WHERE id = ?', [enabled ? 1 : 0, now, id]);
    return this.getSourceById(id);
  }
}

module.exports = new SourceRegistry();
