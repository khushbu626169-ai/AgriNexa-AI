const { describe, it } = require('node:test');
const assert = require('node:assert');
const mandiSearchService = require('../services/mandi/mandiSearchService');

describe('Nationwide Mandi Search Engine Tests', () => {
  it('should retrieve authoritative states list without hardcoding', async () => {
    const states = await mandiSearchService.getStates();
    assert.ok(Array.isArray(states));
    assert.ok(states.length >= 28, 'Should cover Indian states nationwide');

    const stateNames = states.map(s => s.name.toLowerCase());
    assert.ok(stateNames.some(s => s.includes('madhya pradesh')));
    assert.ok(stateNames.some(s => s.includes('maharashtra')));
    assert.ok(stateNames.some(s => s.includes('rajasthan')));
    assert.ok(stateNames.some(s => s.includes('punjab')));
  });

  it('should retrieve comprehensive agricultural commodities', async () => {
    const commodities = await mandiSearchService.getCommodities();
    assert.ok(Array.isArray(commodities));
    assert.ok(commodities.length >= 10);

    const names = commodities.map(c => c.name.toLowerCase());
    assert.ok(names.some(n => n.includes('wheat')));
    assert.ok(names.some(n => n.includes('soyabean') || n.includes('soybean')));
    assert.ok(names.some(n => n.includes('mustard') || n.includes('sarson')));
  });

  it('should return transparent coverage response when no price report exists (never fake prices)', async () => {
    const result = await mandiSearchService.getPrices({
      state: 'Sikkim',
      market: 'NonExistentMandiXYZ',
      crop: 'Soybean'
    });

    assert.strictEqual(result.found, false);
    assert.match(result.message, /No price or arrival entries reported/);
    assert.strictEqual(result.official_source, 'Directorate of Marketing & Inspection (DMI), Agmarknet');
    assert.strictEqual(result.official_url, 'https://agmarknet.gov.in');
  });
});
