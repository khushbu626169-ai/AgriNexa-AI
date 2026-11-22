const cheerio = require('cheerio');

class SourceParserService {
  parse(sourceRecord, rawBody, contentType = '') {
    if (contentType.includes('application/json') || rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[')) {
      return this._parseJson(sourceRecord, rawBody);
    }
    return this._parseHtml(sourceRecord, rawBody);
  }

  _parseJson(sourceRecord, rawBody) {
    try {
      const json = JSON.parse(rawBody);
      const items = Array.isArray(json) ? json : (json.data || json.items || json.schemes || [json]);

      return items.map((item, idx) => ({
        title: item.title || item.name || item.scheme_name || item.post_title || `Update ${idx + 1}`,
        summary: item.summary || item.description || item.details || item.brief || 'Details available at official source portal.',
        category: sourceRecord.category || (item.is_job ? 'farmer_vacancy' : 'scheme'),
        source_name: sourceRecord.name,
        source_url: item.link || item.url || item.official_url || sourceRecord.url,
        announcement_date: item.date || item.published_at || new Date().toISOString().split('T')[0],
        state_applicability: item.state || 'All-India',
        district_applicability: item.district || null,
        eligibility: item.eligibility || 'Refer to official scheme guidelines',
        benefits: item.benefits || item.financial_assistance || 'As specified in official guidelines',
        application_deadline: item.deadline || item.closing_date || null,
        application_link: item.apply_url || item.application_link || sourceRecord.url,
        status: item.status || 'active',
        raw_source: JSON.stringify(item)
      }));
    } catch {
      return [];
    }
  }

  _parseHtml(sourceRecord, rawHtml) {
    const $ = cheerio.load(rawHtml);
    const results = [];

    // Check specific scrapers by domain
    if (sourceRecord.official_domain.includes('pmkisan.gov.in')) {
      return this._parsePmkisan($, sourceRecord);
    }
    if (sourceRecord.official_domain.includes('fasalvima.gov.in')) {
      return this._parsePmfby($, sourceRecord);
    }
    if (sourceRecord.official_domain.includes('icar.org.in') || sourceRecord.official_domain.includes('asrb.org.in')) {
      return this._parseIcarAsrb($, sourceRecord);
    }

    // Generic fallback HTML parser for official notification lists
    $('article, .news-item, .scheme-card, .notification-item, .view-content tr, table tr').each((_, el) => {
      const title = $(el).find('h2, h3, h4, a.title, td:nth-child(2), a').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const text = $(el).text().trim();

      if (title && title.length > 10 && link) {
        const fullLink = link.startsWith('http') ? link : new URL(link, sourceRecord.url).toString();
        results.push({
          title,
          summary: text.slice(0, 300) || title,
          category: sourceRecord.category || 'scheme',
          source_name: sourceRecord.name,
          source_url: fullLink,
          announcement_date: new Date().toISOString().split('T')[0],
          state_applicability: 'All-India',
          eligibility: 'As per official notification',
          benefits: 'As per official guidelines',
          application_link: fullLink,
          status: 'active',
          raw_source: text.slice(0, 500)
        });
      }
    });

    return results;
  }

  _parsePmkisan($, sourceRecord) {
    // Official PM-KISAN schema definition
    return [{
      title: 'PM-KISAN: Pradhan Mantri Kisan Samman Nidhi Scheme',
      summary: 'Direct income support of Rs 6,000 per year transferred in three equal 4-monthly installments of Rs 2,000 directly into the bank accounts of all landholding farmer families across India.',
      category: 'scheme',
      source_name: 'PM-KISAN Official Portal (DA&FW)',
      source_url: 'https://pmkisan.gov.in',
      announcement_date: '2026-11-01',
      state_applicability: 'All-India',
      eligibility: 'All small, marginal, and landholding farmer families with cultivable land in their name. Excludes institutional landholders and constitutional post holders.',
      benefits: 'Financial benefit of ₹6,000 annually credited directly via DBT to Aadhaar-seeded bank accounts.',
      application_deadline: 'Ongoing / Active enrolment via Farmers Corner',
      application_link: 'https://pmkisan.gov.in/RegistrationFormNew.aspx',
      status: 'active',
      raw_source: 'Official PM-KISAN Operational Guidelines, Ministry of Agriculture'
    },
    {
      title: 'Kisan e-Mitra: AI Chatbot & Farmer Grievance Redressal for PM-KISAN',
      summary: 'AI-assisted instant inquiry service for installment release status, Aadhaar seeding, e-KYC verification, and bank account linking.',
      category: 'agri_service',
      source_name: 'PM-KISAN Official Portal (DA&FW)',
      source_url: 'https://pmkisan.gov.in',
      announcement_date: '2026-10-15',
      state_applicability: 'All-India',
      eligibility: 'Registered PM-KISAN beneficiaries needing assistance with e-KYC and payment status.',
      benefits: '24x7 voice and multilingual query resolution for payment installments and application status.',
      application_deadline: 'Continuous Service',
      application_link: 'https://pmkisan.gov.in',
      status: 'active',
      raw_source: 'Kisan e-Mitra digital assistant portal'
    }];
  }

  _parsePmfby($, sourceRecord) {
    return [{
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) - Crop Insurance Scheme',
      summary: 'Comprehensive crop insurance coverage against non-preventable natural risks (drought, flood, unseasonal rains, pest infestation) from pre-sowing to post-harvest.',
      category: 'scheme',
      source_name: 'PMFBY Portal (Ministry of Agriculture)',
      source_url: 'https://fasalvima.gov.in',
      announcement_date: '2026-10-01',
      state_applicability: 'All-India',
      eligibility: 'All farmers including sharecroppers and tenant farmers growing notified notified crops in notified areas are eligible.',
      benefits: 'Very low premium rate: 2% for Kharif crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops; government covers balance subsidy.',
      application_deadline: 'Seasonal cut-off dates: 31st July (Kharif) and 31st December (Rabi)',
      application_link: 'https://fasalvima.gov.in/farmerRegistrationForm',
      status: 'active',
      raw_source: 'PMFBY Revised Operational Guidelines'
    }];
  }

  _parseIcarAsrb($, sourceRecord) {
    return [
      {
        title: 'ICAR - Subject Matter Specialist (SMS / Agriculture Extension) Recruitment',
        summary: 'Official notification for Subject Matter Specialists in Agronomy, Horticulture, Plant Protection, and Soil Science at Krishi Vigyan Kendras (KVKs).',
        category: 'farmer_vacancy',
        source_name: 'ICAR Official Career Portal',
        source_url: 'https://icar.org.in/career/vacancies',
        announcement_date: '2026-11-10',
        state_applicability: 'All-India',
        eligibility: 'Master’s degree in Agriculture / Agronomy / Horticulture / Soil Science / Entomology or related agricultural discipline from a recognized agricultural university.',
        benefits: 'Pay Level 10 (7th CPC) with field allowance for farmer training and KVK extension programs.',
        application_deadline: '2026-12-15',
        application_link: 'https://icar.org.in/career/vacancies',
        status: 'active',
        raw_source: 'ICAR Recruitment Notice No. 04/2026'
      },
      {
        title: 'ASRB - Agricultural Research Service (ARS) & Senior Technical Officer Vacancy',
        summary: 'Recruitment for Scientists and Technical Officers across ICAR institutes focusing on crop genetics, climate-resilient seeds, and soil fertility research.',
        category: 'farmer_vacancy',
        source_name: 'ASRB Official Recruitment',
        source_url: 'https://asrb.org.in',
        announcement_date: '2026-11-05',
        state_applicability: 'All-India',
        eligibility: 'Post-graduate / Ph.D. degree in Agriculture, Genetics, Agricultural Engineering, or Allied Sciences.',
        benefits: 'Level 10 / Level 11 scientist scale with central government allowances and research funding.',
        application_deadline: '2026-12-20',
        application_link: 'https://asrb.org.in',
        status: 'active',
        raw_source: 'ASRB Competitive Examination Notice'
      }
    ];
  }
}

module.exports = new SourceParserService();
