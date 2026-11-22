const { describe, it } = require('node:test');
const assert = require('node:assert');
const chatService = require('../services/chatService');

describe('General Farming Query Handling', () => {
  it('should not return scheme/vacancy fallback for a generic agriculture question', async () => {
    const query = 'गेहूँ की फसल में पहली सिंचाई कब करनी चाहिए और क्यों?';
    const response = await chatService.processMessage(query);
    const fallbackSnippet = 'सत्यापित सरकारी रिकॉर्ड में वर्तमान में कोई आधिकारिक योजना या कृषि रिक्ति नहीं मिली';
    assert.ok(!response.answer.includes(fallbackSnippet), 'Unexpected scheme/vacancy fallback returned');
    assert.ok(response.answer.length > 10, 'Answer should be non‑empty');
    assert.strictEqual(response.language, 'hi');
  });
});
