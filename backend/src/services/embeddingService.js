const https = require('https');
const crypto = require('crypto');
const config = require('../config');

class EmbeddingService {
  constructor() {
    this.dimension = 64; // Compact vector for local semantic search
    this.featureVocabulary = [
      'kisan', 'farmer', 'pmkisan', 'krishi', 'fasal', 'bima', 'insurance', 'subsidy',
      'credit', 'kcc', 'loan', 'mandi', 'bhav', 'rate', 'price', 'crop', 'wheat', 'rice',
      'gehun', 'chawal', 'soybean', 'mustard', 'sarson', 'cotton', 'kapas', 'chana', 'gram',
      'irrigation', 'sinchai', 'drip', 'sprinkler', 'fertilizer', 'urea', 'dap', 'soil',
      'health', 'card', 'seed', 'beej', 'equipment', 'tractor', 'yantra', 'icar', 'asrb',
      'scientist', 'officer', 'technician', 'extension', 'kvk', 'eligibility', 'apply',
      'portal', 'application', 'deadline', 'benefit', 'direct', 'dbt', 'account', 'announcement',
      'active', 'central', 'state', 'government', 'welfare', 'pashupalan', 'dairy', 'poultry'
    ];
  }

  async generateEmbedding(text) {
    if (config.GEMINI_API_KEY && config.LLM_PROVIDER === 'gemini') {
      try {
        const remoteVec = await this._fetchGeminiEmbedding(text);
        if (remoteVec && remoteVec.length > 0) return remoteVec;
      } catch (err) {
        console.warn('Gemini embedding API call failed, falling back to local semantic vector:', err.message);
      }
    }

    return this._generateDeterministicSemanticVector(text);
  }

  _generateDeterministicSemanticVector(text) {
    const cleanText = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleanText.split(/\s+/).filter(Boolean);
    const tokenCounts = {};

    for (const token of tokens) {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    }

    const vector = new Array(this.dimension).fill(0);

    // 1. Feature vocabulary matching
    this.featureVocabulary.forEach((word, idx) => {
      if (tokenCounts[word]) {
        vector[idx % this.dimension] += tokenCounts[word] * 2.5;
      }
    });

    // 2. Hash-based n-gram embedding for vocabulary coverage
    for (const token of tokens) {
      const hash = crypto.createHash('md5').update(token).digest();
      const pos = hash.readUInt16BE(0) % this.dimension;
      vector[pos] += 1.0;
    }

    // Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  _fetchGeminiEmbedding(text) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      });

      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/text-embedding-004:embedContent?key=${config.GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.embedding && parsed.embedding.values) {
              resolve(parsed.embedding.values);
            } else {
              reject(new Error(parsed.error ? parsed.error.message : 'Invalid embedding response'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Embedding API timed out'));
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new EmbeddingService();
