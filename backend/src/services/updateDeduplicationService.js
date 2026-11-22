const crypto = require('crypto');
const db = require('../db');

class UpdateDeduplicationService {
  computeContentHash(title, summary, state) {
    const normalized = `${(title || '').trim().toLowerCase()}|${(summary || '').trim().toLowerCase()}|${(state || 'All-India').trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  isDuplicate(canonicalUrl, contentHash, title) {
    // 1. Exact canonical URL match
    const urlMatch = db.get('SELECT id, title, canonical_url FROM updates WHERE canonical_url = ?', [canonicalUrl]);
    if (urlMatch) {
      return {
        isDuplicate: true,
        reason: 'canonical_url_match',
        existingId: urlMatch.id,
        existingTitle: urlMatch.title
      };
    }

    // 2. Exact content hash match
    const hashMatch = db.get('SELECT id, title FROM updates WHERE content_hash = ?', [contentHash]);
    if (hashMatch) {
      return {
        isDuplicate: true,
        reason: 'content_hash_match',
        existingId: hashMatch.id,
        existingTitle: hashMatch.title
      };
    }

    // 3. Normalized title similarity check (token set ratio)
    const recentUpdates = db.query('SELECT id, title FROM updates ORDER BY created_at DESC LIMIT 100');
    const inputTokens = new Set(this._tokenize(title));

    for (const existing of recentUpdates) {
      const existingTokens = new Set(this._tokenize(existing.title));
      const intersection = new Set([...inputTokens].filter(x => existingTokens.has(x)));
      const similarity = (2.0 * intersection.size) / (inputTokens.size + existingTokens.size);

      if (similarity >= 0.88) {
        return {
          isDuplicate: true,
          reason: 'high_similarity_match',
          existingId: existing.id,
          existingTitle: existing.title
        };
      }
    }

    return { isDuplicate: false };
  }

  _tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }
}

module.exports = new UpdateDeduplicationService();
