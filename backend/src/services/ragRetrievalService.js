const db = require('../db');
const embeddingService = require('./embeddingService');

class RagRetrievalService {
  async retrieve(queryText, options = {}) {
    const { category, state, limit = 5, minScore = 0.25 } = options;

    // 1. Generate query embedding
    const queryVec = await embeddingService.generateEmbedding(queryText);

    // 2. Fetch candidate documents from database
    let sql = 'SELECT * FROM updates WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (state && state !== 'All-India') {
      sql += " AND (state_applicability = ? OR state_applicability = 'All-India')";
      params.push(state);
    }

    const rows = db.query(sql, params);

    // 3. Score candidates with cosine similarity and keyword boost
    const scoredDocs = [];
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    for (const doc of rows) {
      let vectorScore = 0;
      if (doc.embedding) {
        try {
          const docVec = JSON.parse(doc.embedding);
          vectorScore = embeddingService.cosineSimilarity(queryVec, docVec);
        } catch {
          vectorScore = 0;
        }
      }

      // Keyword overlap boost
      const docText = `${doc.title} ${doc.summary} ${doc.eligibility || ''}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (docText.includes(token)) matchCount++;
      }
      const keywordBoost = matchCount > 0 ? Math.min(0.3, matchCount * 0.08) : 0;

      const totalScore = vectorScore * 0.7 + keywordBoost * 0.3;

      if (totalScore >= minScore) {
        scoredDocs.push({
          id: doc.id,
          title: doc.title,
          summary: doc.summary,
          category: doc.category,
          source_name: doc.source_name,
          source_url: doc.source_url,
          canonical_url: doc.canonical_url,
          announcement_date: doc.announcement_date,
          state_applicability: doc.state_applicability,
          eligibility: doc.eligibility,
          benefits: doc.benefits,
          application_deadline: doc.application_deadline,
          application_link: doc.application_link,
          status: doc.status,
          relevance_score: doc.relevance_score,
          score: totalScore
        });
      }
    }

    // Sort by combined score descending
    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs.slice(0, limit);
  }
}

module.exports = new RagRetrievalService();
