const { describe, it } = require('node:test');
const assert = require('node:assert');
const sourceValidationService = require('../services/sourceValidationService');

describe('Source Validation & Canonical URL Tests', () => {
  it('should accept official government and agricultural research domains', () => {
    const validUrls = [
      'https://pmkisan.gov.in/RegistrationFormNew.aspx',
      'https://fasalvima.gov.in/farmerRegistrationForm',
      'https://agricoop.nic.in/en/Major-programmes',
      'https://icar.org.in/career/vacancies',
      'https://asrb.org.in/vacancy-details',
      'https://agmarknet.gov.in/SearchCmmMkt.aspx',
      'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      'https://krishi.maharashtra.gov.in/scheme'
    ];

    for (const url of validUrls) {
      assert.strictEqual(sourceValidationService.isOfficialDomain(url), true, `Failed for valid URL: ${url}`);
    }
  });

  it('should reject untrusted and social media sources', () => {
    const invalidUrls = [
      'https://twitter.com/random_user/status/123456',
      'https://facebook.com/groups/farmernews',
      'https://freejobalert.fake-domain.xyz/jobs',
      'https://unknown-blog-site.com/pmkisan-fake-list',
      'http://localhost:3000/test'
    ];

    for (const url of invalidUrls) {
      assert.strictEqual(sourceValidationService.isOfficialDomain(url), false, `Accepted untrusted URL: ${url}`);
    }
  });

  it('should normalize canonical URLs and strip tracking parameters', () => {
    const dirtyUrl = 'https://PMKISAN.gov.in/RegistrationForm.aspx?utm_source=whatsapp&utm_medium=forward&ref=123';
    const cleanUrl = sourceValidationService.normalizeCanonicalUrl(dirtyUrl);

    assert.strictEqual(cleanUrl, 'https://pmkisan.gov.in/RegistrationForm.aspx');
  });
});
