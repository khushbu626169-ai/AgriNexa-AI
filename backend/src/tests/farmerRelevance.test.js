const { describe, it } = require('node:test');
const assert = require('node:assert');
const farmerRelevanceService = require('../services/farmerRelevanceService');

describe('Farmer Relevance Classification Tests', () => {
  it('should ACCEPT agricultural schemes with high score', () => {
    const item = {
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      summary: 'Income support scheme transferring Rs 6,000 annually to landholding farmer families across India for purchasing agricultural seeds and fertilizers.',
      category: 'scheme',
      eligibility: 'All landholding farmers',
      benefits: 'Rs 6,000 per year'
    };

    const res = farmerRelevanceService.evaluateRelevance(item);
    assert.strictEqual(res.isRelevant, true);
    assert.ok(res.score >= 0.7);
    assert.match(res.reason, /Verified farmer scheme/);
  });

  it('should ACCEPT genuine farmer/agricultural vacancies', () => {
    const item = {
      title: 'ICAR - Subject Matter Specialist (Agronomy & Soil Health) Recruitment',
      summary: 'Recruitment of Agricultural Extension Specialists to train farmers on drip irrigation, organic farming, and pest control at Krishi Vigyan Kendras.',
      category: 'farmer_vacancy',
      eligibility: 'Master degree in Agriculture / Agronomy',
      benefits: 'Pay Level 10'
    };

    const res = farmerRelevanceService.evaluateRelevance(item);
    assert.strictEqual(res.isRelevant, true);
    assert.ok(res.score >= 0.7);
    assert.match(res.reason, /Verified agricultural vacancy/);
  });

  it('should REJECT generic government jobs (SSC CGL / Railways / Banking)', () => {
    const items = [
      {
        title: 'SSC CGL Notification 2026 for Combined Graduate Level Examination',
        summary: 'Staff Selection Commission invites applications for Assistant Section Officer, Income Tax Inspector, and Central Excise Inspector.',
        category: 'farmer_vacancy'
      },
      {
        title: 'Railway Recruitment Board (RRB NTPC) Non-Technical Popular Categories',
        summary: 'Recruitment for station masters, goods train guards, junior clerks, and ticket collectors in Indian Railways.',
        category: 'farmer_vacancy'
      },
      {
        title: 'IBPS Probationary Officer (PO) & Clerk Recruitment in Public Sector Banks',
        summary: 'Vacancies for bank branch officers, financial analysts, and cashiers across public commercial banks.',
        category: 'farmer_vacancy'
      },
      {
        title: 'State Police Constable Recruitment Board Vacancies',
        summary: 'Notification for recruitment of 5,000 police constables and sub-inspectors in law enforcement.',
        category: 'farmer_vacancy'
      }
    ];

    for (const item of items) {
      const res = farmerRelevanceService.evaluateRelevance(item);
      assert.strictEqual(res.isRelevant, false, `Failed to reject generic job: ${item.title}`);
      assert.ok(res.score <= 0.2);
      assert.match(res.reason, /Excluded due to generic|lacks verifiable agricultural/);
    }
  });

  it('should REJECT unrelated news, politics, and entertainment', () => {
    const items = [
      {
        title: 'Bollywood Celebrity Wedding Celebrated in Udaipur',
        summary: 'Top film actors host star-studded marriage reception attended by VIP personalities.',
        category: 'scheme'
      },
      {
        title: 'Cryptocurrency Market Surges Following Global Trading Rally',
        summary: 'Bitcoin and Ethereum reach new high as digital asset trading volumes double.',
        category: 'scheme'
      }
    ];

    for (const item of items) {
      const res = farmerRelevanceService.evaluateRelevance(item);
      assert.strictEqual(res.isRelevant, false, `Failed to reject unrelated content: ${item.title}`);
    }
  });
});
