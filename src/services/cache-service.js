import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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

    // Create the cache table
    db.exec(`
      CREATE TABLE IF NOT EXISTS review_cache (
        text_hash TEXT PRIMARY KEY,
        sentiment TEXT NOT NULL,
        topics TEXT NOT NULL,
        summary TEXT NOT NULL,
        needs_reply INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
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
 * Clears the cache. Useful for tests or database resets.
 */
export function clearCache() {
  const database = getDb();
  database.exec('DELETE FROM review_cache');
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
