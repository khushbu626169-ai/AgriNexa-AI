const { describe, it } = require('node:test');
const assert = require('node:assert');
const updateDeduplicationService = require('../services/updateDeduplicationService');

describe('Update Deduplication Tests', () => {
  it('should produce identical content hashes for identical normalized text', () => {
    const hash1 = updateDeduplicationService.computeContentHash(
      'PM-KISAN Scheme 17th Installment',
      'Direct benefit transfer of Rs 2000 to eligible farmer bank accounts.',
      'All-India'
    );

    const hash2 = updateDeduplicationService.computeContentHash(
      '  pm-kisan scheme 17th installment  ',
      'direct benefit transfer of rs 2000 to eligible farmer bank accounts.  ',
      'All-India'
    );

    assert.strictEqual(hash1, hash2);
  });

  it('should produce different hashes for different schemes', () => {
    const hash1 = updateDeduplicationService.computeContentHash(
      'PM-KISAN Scheme',
      'Direct income support.',
      'All-India'
    );

    const hash2 = updateDeduplicationService.computeContentHash(
      'PMFBY Crop Insurance',
      'Insurance for non-preventable natural disaster.',
      'All-India'
    );

    assert.notStrictEqual(hash1, hash2);
  });
});
