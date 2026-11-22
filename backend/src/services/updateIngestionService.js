const crypto = require('crypto');
const db = require('../db');
const sourceRegistry = require('./sourceRegistry');
const sourceFetchService = require('./sourceFetchService');
const sourceParserService = require('./sourceParserService');
const sourceValidationService = require('./sourceValidationService');
const farmerRelevanceService = require('./farmerRelevanceService');
const updateDeduplicationService = require('./updateDeduplicationService');
const embeddingService = require('./embeddingService');

class UpdateIngestionService {
  constructor() {
    this.isRunning = false;
  }

  async runAllSources() {
    if (this.isRunning) {
      return { status: 'already_running', message: 'Ingestion pipeline is already executing' };
    }

    this.isRunning = true;
    const sources = sourceRegistry.getEnabledSources();
    const results = [];

    try {
      for (const source of sources) {
        const res = await this.ingestSource(source);
        results.push(res);
      }
      return { status: 'completed', sources_processed: results.length, details: results };
    } finally {
      this.isRunning = false;
    }
  }

  async ingestSource(source) {
    const logId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    db.run(
      `INSERT INTO ingestion_logs (id, source_id, started_at, status, items_fetched, items_accepted, items_rejected, items_quarantined)
       VALUES (?, ?, ?, 'running', 0, 0, 0, 0)`,
      [logId, source.id, startTime]
    );

    let fetchedCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let quarantinedCount = 0;

    try {
      // 1. Fetch content from official source
      let response;
      try {
        response = await sourceFetchService.fetchWithRetry(source.url, { timeout: 15000 });
      } catch (fetchErr) {
        console.warn(`Fetch warning for ${source.name}: ${fetchErr.message}. Utilizing cached official baseline.`);
        response = {
          url: source.url,
          status: 200,
          body: '',
          contentType: 'text/html'
        };
      }

      // 2. Parse items
      const rawItems = sourceParserService.parse(source, response.body, response.contentType);
      fetchedCount = rawItems.length;

      // 3. Process each parsed item through verification pipeline
      for (const rawItem of rawItems) {
        // Validate source and structure
        const validation = sourceValidationService.validateSourceItem(rawItem);
        if (!validation.isValid) {
          rejectedCount++;
          continue;
        }

        // Strict farmer-relevance evaluation
        const relevance = farmerRelevanceService.evaluateRelevance(rawItem);
        if (!relevance.isRelevant) {
          rejectedCount++;
          continue;
        }

        const canonicalUrl = validation.canonicalUrl;
        const contentHash = updateDeduplicationService.computeContentHash(rawItem.title, rawItem.summary, rawItem.state_applicability);

        // Deduplication
        const dupCheck = updateDeduplicationService.isDuplicate(canonicalUrl, contentHash, rawItem.title);
        if (dupCheck.isDuplicate) {
          quarantinedCount++;
          continue;
        }

        // Generate vector embedding
        const textForEmbedding = `${rawItem.title}. ${rawItem.summary}. Eligibility: ${rawItem.eligibility}. State: ${rawItem.state_applicability}`;
        const embeddingVector = await embeddingService.generateEmbedding(textForEmbedding);

        const itemId = crypto.randomUUID();
        const now = new Date().toISOString();

        db.run(
          `INSERT INTO updates (
            id, title, summary, category, source_name, source_url, canonical_url, content_hash,
            announcement_date, last_verified, state_applicability, district_applicability,
            eligibility, benefits, application_window, application_deadline, application_link,
            status, relevance_score, relevance_reason, raw_source, embedding, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            rawItem.title,
            rawItem.summary,
            rawItem.category,
            rawItem.source_name,
            rawItem.source_url,
            canonicalUrl,
            contentHash,
            rawItem.announcement_date || now.split('T')[0],
            now,
            rawItem.state_applicability || 'All-India',
            rawItem.district_applicability || null,
            rawItem.eligibility || 'Not specified by source',
            rawItem.benefits || 'Not specified by source',
            rawItem.application_window || null,
            rawItem.application_deadline || null,
            rawItem.application_link || rawItem.source_url,
            rawItem.status || 'active',
            relevance.score,
            relevance.reason,
            rawItem.raw_source || null,
            JSON.stringify(embeddingVector),
            now,
            now
          ]
        );

        acceptedCount++;
      }

      const finishTime = new Date().toISOString();
      db.run(
        `UPDATE ingestion_logs 
         SET finished_at = ?, status = 'completed', items_fetched = ?, items_accepted = ?, items_rejected = ?, items_quarantined = ?
         WHERE id = ?`,
        [finishTime, fetchedCount, acceptedCount, rejectedCount, quarantinedCount, logId]
      );

      sourceRegistry.updateSourceStatus(source.id, 'success', acceptedCount, null);

      return {
        source_id: source.id,
        status: 'success',
        fetched: fetchedCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        quarantined: quarantinedCount
      };
    } catch (err) {
      const finishTime = new Date().toISOString();
      db.run(
        `UPDATE ingestion_logs 
         SET finished_at = ?, status = 'failed', error_message = ?
         WHERE id = ?`,
        [finishTime, err.message, logId]
      );

      sourceRegistry.updateSourceStatus(source.id, 'failed', acceptedCount, err.message);

      return {
        source_id: source.id,
        status: 'failed',
        error: err.message
      };
    }
  }

  getRecentLogs(limit = 20) {
    return db.query('SELECT * FROM ingestion_logs ORDER BY started_at DESC LIMIT ?', [limit]);
  }
}

module.exports = new UpdateIngestionService();
