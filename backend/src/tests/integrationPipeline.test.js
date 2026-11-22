const { describe, it } = require('node:test');
const assert = require('node:assert');
const updateIngestionService = require('../services/updateIngestionService');
const sourceValidationService = require('../services/sourceValidationService');
const farmerRelevanceService = require('../services/farmerRelevanceService');
const chatService = require('../services/chatService');
const mandiSearchService = require('../services/mandi/mandiSearchService');
const db = require('../db');

describe('Full Integration Pipeline Tests', () => {
  it('pipeline should reject an item with an untrusted social media domain', () => {
    const rawItem = {
      title: 'Farmer subsidy of Rs 50000 announced on WhatsApp forward',
      summary: 'Forwarded message offering free tractor subsidy.',
      category: 'scheme',
      source_url: 'https://whatsapp.com/fake-forward'
    };

    const val = sourceValidationService.validateSourceItem(rawItem);
    assert.strictEqual(val.isValid, false);
    assert.match(val.errors[0], /does not belong to an official or trusted/);
  });

  it('pipeline should reject generic civil/railway/police jobs during classification', () => {
    const rawJob = {
      title: 'Railway Protection Force (RPF) Constable Vacancy 2026',
      summary: 'Recruitment for 4000 security constables in Indian Railways. Exam conducted by RRB.',
      category: 'farmer_vacancy',
      source_url: 'https://asrb.org.in/fake-test'
    };

    const relevance = farmerRelevanceService.evaluateRelevance(rawJob);
    assert.strictEqual(relevance.isRelevant, false);
    assert.match(relevance.reason, /Excluded due to generic|lacks verifiable agricultural/);
  });

  it('pipeline should accept and store verified agricultural schemes', () => {
    const rawScheme = {
      title: 'Kisan Credit Card (KCC) Scheme with Interest Subvention',
      summary: 'Institutional short-term credit for farmers up to Rs 3 lakh at 4% effective interest rate with prompt repayment incentive for crop production expenses.',
      category: 'scheme',
      source_name: 'DA&FW Official Schemes',
      source_url: 'https://agricoop.nic.in/en/kcc',
      announcement_date: '2026-11-10',
      state_applicability: 'All-India',
      eligibility: 'All farmers, individual/joint borrowers, tenant farmers, oral lessees, and sharecroppers.',
      benefits: 'Short term crop loans up to ₹3,00,000 at subsidized 4% interest rate.',
      application_link: 'https://agricoop.nic.in/en/kcc',
      status: 'active'
    };

    const val = sourceValidationService.validateSourceItem(rawScheme);
    assert.strictEqual(val.isValid, true);

    const rel = farmerRelevanceService.evaluateRelevance(rawScheme);
    assert.strictEqual(rel.isRelevant, true);
  });

  it('chatbot should answer realistic Hindi mandi price inquiry', async () => {
    const response = await chatService.processMessage('Indore district ki aaj ki mandi mein gehun ka rate batao.');
    assert.strictEqual(response.language, 'hi');
    assert.strictEqual(response.entities.crop, 'wheat');
    assert.ok(response.answer.length > 30);
    assert.ok(response.citations.length > 0);
  });

  it('chatbot should answer Akola soybean query with structured entity parsing', async () => {
    const response = await chatService.processMessage('Soybean ka rate Maharashtra ke Akola mandi mein kya hai?');
    assert.strictEqual(response.entities.crop, 'soybean');
    assert.strictEqual(response.entities.state, 'Maharashtra');
    assert.strictEqual(response.entities.market, 'Akola');
    assert.ok(response.citations.length > 0);
  });

  it('database and updates table should be properly indexed and queried', () => {
    const updates = db.query('SELECT COUNT(*) as count FROM updates');
    assert.ok(updates[0].count >= 0);

    const indices = db.query("SELECT name FROM sqlite_master WHERE type='index'");
    const indexNames = indices.map(i => i.name);
    assert.ok(indexNames.includes('idx_updates_category'));
    assert.ok(indexNames.includes('idx_updates_state'));
    assert.ok(indexNames.includes('idx_mandi_lookup'));
  });
});
