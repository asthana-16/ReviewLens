import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const PROMPT_VERSION = 'v1';

/**
 * Creates an analysis cache key taking into account review text and prompt/model version.
 */
export function createAnalysisCacheKey(text, promptVersion = PROMPT_VERSION) {
  const normalized = (text || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (promptVersion === 'v1') {
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  }
  return crypto.createHash('sha256').update(`${normalized}:${promptVersion}`, 'utf8').digest('hex');
}

function getDbPath() {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return path.join(process.cwd(), 'reviewlens.test.db');
  }
  if (process.env.VERCEL) {
    const tmpDb = '/tmp/reviewlens.db';
    const rootDb = path.join(process.cwd(), 'reviewlens.db');
    if (!fs.existsSync(tmpDb) && fs.existsSync(rootDb)) {
      try {
        fs.copyFileSync(rootDb, tmpDb);
      } catch (e) {
        console.warn('Could not copy initial db to /tmp:', e);
      }
    }
    return tmpDb;
  }
  return path.join(process.cwd(), 'reviewlens.db');
}

let db = null;

/**
 * Gets or creates the SQLite database connection.
 * Creates the cache table if it doesn't exist.
 */
export function getDb() {
  if (!db) {
    db = new Database(getDbPath());

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');

    // Create tables: cache, datasets, and dataset_reviews
    db.exec(`
      CREATE TABLE IF NOT EXISTS review_cache (
        text_hash TEXT PRIMARY KEY,
        sentiment TEXT NOT NULL,
        topics TEXT NOT NULL,
        summary TEXT NOT NULL,
        needs_reply INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        total_uploaded INTEGER NOT NULL,
        total_processed INTEGER NOT NULL,
        cache_hits INTEGER NOT NULL,
        ai_calls INTEGER NOT NULL,
        failed INTEGER NOT NULL,
        skipped INTEGER NOT NULL,
        duplicates INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        summary_json TEXT
      );

      CREATE TABLE IF NOT EXISTS dataset_reviews (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        review_id TEXT NOT NULL,
        product TEXT,
        rating INTEGER,
        date TEXT,
        review_text TEXT,
        text_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        analysis_status TEXT NOT NULL,
        is_cached INTEGER NOT NULL DEFAULT 0,
        rating_mismatch INTEGER NOT NULL DEFAULT 0,
        sentiment TEXT,
        topics TEXT,
        summary TEXT,
        needs_reply INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_dataset_reviews_dataset_id ON dataset_reviews(dataset_id);
    `);

    // Seed initial cache if empty and not in test environment
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      try {
        const countRow = db.prepare('SELECT count(*) as count FROM review_cache').get();
        if (countRow.count === 0) {
          const seedPath = path.join(process.cwd(), 'src', 'data', 'seed-cache.json');
          if (fs.existsSync(seedPath)) {
            const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
            const insertStmt = db.prepare(`
              INSERT OR IGNORE INTO review_cache (text_hash, sentiment, topics, summary, needs_reply)
              VALUES (@text_hash, @sentiment, @topics, @summary, @needs_reply)
            `);
            const insertMany = db.transaction((rows) => {
              for (const row of rows) insertStmt.run(row);
            });
            insertMany(seedData);
          }
        }
      } catch (seedErr) {
        console.warn('Could not seed initial cache:', seedErr);
      }
    }
  }
  return db;
}

/**
 * Looks up a cached analysis by text hash.
 * Returns the analysis if found, null otherwise.
 */
export function getCachedAnalysis(textHash) {
  const database = getDb();
  const row = database
    .prepare('SELECT sentiment, topics, summary, needs_reply FROM review_cache WHERE text_hash = ?')
    .get(textHash);

  if (!row) return null;

  return {
    sentiment: row.sentiment,
    topics: JSON.parse(row.topics),
    summary: row.summary,
    needs_reply: Boolean(row.needs_reply),
  };
}

/**
 * Saves an analysis result to the persistent cache.
 */
export function saveAnalysis(textHash, analysis) {
  const database = getDb();
  database
    .prepare(
      `INSERT OR REPLACE INTO review_cache (text_hash, sentiment, topics, summary, needs_reply, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      textHash,
      analysis.sentiment,
      JSON.stringify(analysis.topics),
      analysis.summary,
      analysis.needs_reply ? 1 : 0
    );
}

/**
 * Checks which hashes already have cached results.
 * Returns a map of hash -> analysis for all found entries.
 */
export function batchLookup(hashes) {
  const results = new Map();
  if (!hashes || hashes.length === 0) return results;

  const database = getDb();

  const BATCH_SIZE = 100;
  for (let i = 0; i < hashes.length; i += BATCH_SIZE) {
    const batch = hashes.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => '?').join(',');
    const rows = database
      .prepare(
        `SELECT text_hash, sentiment, topics, summary, needs_reply
         FROM review_cache
         WHERE text_hash IN (${placeholders})`
      )
      .all(...batch);

    for (const row of rows) {
      results.set(row.text_hash, {
        sentiment: row.sentiment,
        topics: JSON.parse(row.topics),
        summary: row.summary,
        needs_reply: Boolean(row.needs_reply),
      });
    }
  }

  return results;
}

/**
 * Saves a dataset record in SQLite.
 */
export function saveDataset(record) {
  const database = getDb();
  database
    .prepare(
      `INSERT OR REPLACE INTO datasets (
        id, filename, total_uploaded, total_processed, cache_hits,
        ai_calls, failed, skipped, duplicates, duration_ms, created_at, summary_json
      ) VALUES (
        @id, @filename, @total_uploaded, @total_processed, @cache_hits,
        @ai_calls, @failed, @skipped, @duplicates, @duration_ms, COALESCE(@created_at, datetime('now')), @summary_json
      )`
    )
    .run({
      id: record.id,
      filename: record.filename,
      total_uploaded: record.totalUploaded ?? record.total_uploaded ?? 0,
      total_processed: record.totalProcessed ?? record.total_processed ?? 0,
      cache_hits: record.cacheHits ?? record.cache_hits ?? 0,
      ai_calls: record.aiCalls ?? record.ai_calls ?? 0,
      failed: record.failed ?? 0,
      skipped: record.skipped ?? 0,
      duplicates: record.duplicates ?? 0,
      duration_ms: record.durationMs ?? record.duration_ms ?? 0,
      created_at: record.createdAt || record.created_at || null,
      summary_json:
        typeof record.summaryJson === 'string'
          ? record.summaryJson
          : JSON.stringify(record.summaryJson || {}),
    });
}

/**
 * Saves all reviews for a specific dataset into SQLite.
 */
export function saveDatasetReviews(datasetId, reviews) {
  const database = getDb();
  const insertStmt = database.prepare(
    `INSERT OR REPLACE INTO dataset_reviews (
      id, dataset_id, review_id, product, rating, date, review_text,
      text_hash, status, analysis_status, is_cached, rating_mismatch,
      sentiment, topics, summary, needs_reply
    ) VALUES (
      @id, @dataset_id, @review_id, @product, @rating, @date, @review_text,
      @text_hash, @status, @analysis_status, @is_cached, @rating_mismatch,
      @sentiment, @topics, @summary, @needs_reply
    )`
  );

  const insertMany = database.transaction((rows) => {
    for (const [index, r] of rows.entries()) {
      const rowId = `${datasetId}_${r.reviewId || index}`;
      insertStmt.run({
        id: rowId,
        dataset_id: datasetId,
        review_id: r.reviewId || `REV_${index + 1}`,
        product: r.product || '',
        rating: r.rating !== undefined && r.rating !== null ? r.rating : null,
        date: r.date || '',
        review_text: r.reviewText || '',
        text_hash: r.textHash || '',
        status: r.status || 'valid',
        analysis_status: r.analysisStatus || (r.analysis ? 'completed' : 'failed'),
        is_cached: r.isCached ? 1 : 0,
        rating_mismatch: r.ratingMismatch ? 1 : 0,
        sentiment: r.analysis ? r.analysis.sentiment : null,
        topics: r.analysis && r.analysis.topics ? JSON.stringify(r.analysis.topics) : null,
        summary: r.analysis ? r.analysis.summary : null,
        needs_reply: r.analysis && r.analysis.needs_reply ? 1 : 0,
      });
    }
  });

  insertMany(reviews);
}

/**
 * Lists all uploaded datasets with summary statistics, ordered newest first.
 */
export function listDatasets() {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT id, filename, total_uploaded, total_processed, cache_hits,
              ai_calls, failed, skipped, duplicates, duration_ms, created_at, summary_json
       FROM datasets
       ORDER BY created_at DESC, id DESC`
    )
    .all();

  return rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    totalUploaded: row.total_uploaded,
    totalProcessed: row.total_processed,
    cacheHits: row.cache_hits,
    aiCalls: row.ai_calls,
    failed: row.failed,
    skipped: row.skipped,
    duplicates: row.duplicates,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    summary: row.summary_json ? JSON.parse(row.summary_json) : null,
  }));
}

/**
 * Fetches dataset metadata by dataset ID.
 */
export function getDataset(datasetId) {
  const database = getDb();
  const row = database
    .prepare(
      `SELECT id, filename, total_uploaded, total_processed, cache_hits,
              ai_calls, failed, skipped, duplicates, duration_ms, created_at, summary_json
       FROM datasets
       WHERE id = ?`
    )
    .get(datasetId);

  if (!row) return null;

  return {
    id: row.id,
    filename: row.filename,
    totalUploaded: row.total_uploaded,
    totalProcessed: row.total_processed,
    cacheHits: row.cache_hits,
    aiCalls: row.ai_calls,
    failed: row.failed,
    skipped: row.skipped,
    duplicates: row.duplicates,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    summary: row.summary_json ? JSON.parse(row.summary_json) : null,
  };
}

/**
 * Fetches reviews strictly belonging to a specific dataset ID.
 */
export function getDatasetReviews(datasetId) {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT review_id, product, rating, date, review_text, text_hash,
              status, analysis_status, is_cached, rating_mismatch,
              sentiment, topics, summary, needs_reply
       FROM dataset_reviews
       WHERE dataset_id = ?
       ORDER BY rowid ASC`
    )
    .all(datasetId);

  return rows.map((r) => ({
    reviewId: r.review_id,
    product: r.product,
    rating: r.rating,
    date: r.date,
    reviewText: r.review_text,
    textHash: r.text_hash,
    status: r.status,
    analysisStatus: r.analysis_status,
    isCached: Boolean(r.is_cached),
    ratingMismatch: Boolean(r.rating_mismatch),
    analysis: r.sentiment
      ? {
          sentiment: r.sentiment,
          topics: r.topics ? JSON.parse(r.topics) : [],
          summary: r.summary || '',
          needs_reply: Boolean(r.needs_reply),
        }
      : null,
  }));
}

/**
 * Updates a specific review in dataset_reviews.
 */
export function updateReviewInDataset(datasetId, reviewId, updatedFields) {
  const database = getDb();
  const fields = [];
  const params = [];

  if (updatedFields.analysis) {
    fields.push(
      'sentiment = ?',
      'topics = ?',
      'summary = ?',
      'needs_reply = ?',
      'analysis_status = ?'
    );
    params.push(
      updatedFields.analysis.sentiment,
      JSON.stringify(updatedFields.analysis.topics || []),
      updatedFields.analysis.summary || '',
      updatedFields.analysis.needs_reply ? 1 : 0,
      'completed'
    );
  }
  if (updatedFields.ratingMismatch !== undefined) {
    fields.push('rating_mismatch = ?');
    params.push(updatedFields.ratingMismatch ? 1 : 0);
  }

  if (fields.length === 0) return;

  params.push(datasetId, reviewId);
  database
    .prepare(
      `UPDATE dataset_reviews
       SET ${fields.join(', ')}
       WHERE dataset_id = ? AND review_id = ?`
    )
    .run(...params);
}

/**
 * Deletes a dataset and its isolated reviews (via cascade).
 */
export function deleteDataset(datasetId) {
  const database = getDb();
  database.prepare('DELETE FROM datasets WHERE id = ?').run(datasetId);
}

/**
 * Clears the cache and all datasets. Useful for tests or database resets.
 */
export function clearCache() {
  const database = getDb();
  database.exec('DELETE FROM review_cache');
  database.exec('DELETE FROM dataset_reviews');
  database.exec('DELETE FROM datasets');
}

/**
 * Closes the database connection. Useful for cleanup.
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
