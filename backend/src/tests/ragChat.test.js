const { describe, it } = require('node:test');
const assert = require('node:assert');
const chatService = require('../services/chatService');
const updateIngestionService = require('../services/updateIngestionService');
const sourceRegistry = require('../services/sourceRegistry');

describe('RAG Chat & Grounded Citations Tests', () => {
  it('should detect Hindi language and Hinglish queries', () => {
    assert.strictEqual(chatService.detectLanguage('मध्य प्रदेश में किसानों के लिए कौन सी नई योजना है?'), 'hi');
    assert.strictEqual(chatService.detectLanguage('Indore mandi mein gehun ka rate kya hai?'), 'hi');
    assert.strictEqual(chatService.detectLanguage('What are the active vacancies in ICAR?'), 'en');
  });

  it('should extract entities accurately from natural queries', () => {
    const e1 = chatService.extractEntities('Soybean ka rate Maharashtra ke Akola mandi mein kya hai?');
    assert.strictEqual(e1.crop, 'soybean');
    assert.strictEqual(e1.state, 'Maharashtra');
    assert.strictEqual(e1.market, 'Akola');

    const e2 = chatService.extractEntities('Abhi agriculture-related farmer vacancies kaun si open hain?');
    assert.strictEqual(e2.intent, 'vacancy');

    const e3 = chatService.extractEntities('PM-KISAN ke liye eligibility aur apply link kya hai?');
    assert.strictEqual(e3.intent, 'scheme');
  });

  it('should answer scheme queries with grounded official citations', async () => {
    // Seed initial official records
    const pmkisanSrc = sourceRegistry.getSourceById('pmkisan_official');
    if (pmkisanSrc) {
      await updateIngestionService.ingestSource(pmkisanSrc);
    }

    const response = await chatService.processMessage('PM-KISAN eligibility and official apply link');
    assert.ok(response.answer.length > 50);
    assert.ok(response.citations.length > 0);
    assert.strictEqual(response.citations[0].source_name, 'PM-KISAN Official Portal (DA&FW)');
    assert.strictEqual(response.citations[0].source_url, 'https://pmkisan.gov.in');
  });
});
