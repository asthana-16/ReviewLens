import crypto from 'crypto';
import Papa from 'papaparse';
import type { RawReview, CleanedReview } from '@/types';

/**
 * Parses a CSV string into raw review objects.
 * Uses PapaParse for safe, robust CSV parsing.
 */
export function parseCSV(csvContent: string): {
  reviews: RawReview[];
  errors: string[];
} {
  const errors: string[] = [];

  const result = Papa.parse<RawReview>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  // Check for required columns
  const requiredColumns = ['review_id', 'product', 'rating', 'date', 'review_text'];
  const headers = result.meta.fields || [];
  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }

  if (errors.length > 0) {
    return { reviews: [], errors };
  }

  // Report parsing errors but don't crash
  for (const error of result.errors) {
    errors.push(`Row ${error.row}: ${error.message}`);
  }

  return { reviews: result.data, errors };
}

/**
 * Normalizes review text for consistent hashing and duplicate detection.
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Converts to lowercase
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Creates a SHA-256 hash of normalized text for cache keys and duplicate detection.
 */
export function hashText(text: string): string {
  const normalized = normalizeText(text);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Parses a rating value from the CSV.
 * Returns a number (1-5) or null for missing/invalid ratings.
 * Handles edge cases like "five", empty strings, non-numeric values.
 */
export function parseRating(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null || raw.trim() === '') {
    return null; // Missing rating → unknown
  }

  const trimmed = raw.trim();

  // Try parsing as a number first
  const num = Number(trimmed);
  if (!isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)) {
    return num;
  }

  // Don't try to convert word ratings like "five" — treat as unknown
  // The assignment says invalid ratings like "five" should be unknown
  return null;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * Review text is treated as untrusted user input.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Cleans and validates a batch of raw reviews.
 * Returns cleaned reviews and processing statistics.
 */
export function cleanReviews(rawReviews: RawReview[]): {
  cleaned: CleanedReview[];
  skipped: number;
  duplicateCount: number;
  duplicateMap: Map<string, string[]>; // hash → list of review IDs with same text
} {
  const cleaned: CleanedReview[] = [];
  let skipped = 0;
  const seenHashes = new Map<string, string>(); // hash → first review ID
  const duplicateMap = new Map<string, string[]>(); // hash → all review IDs
  let duplicateCount = 0;

  for (const raw of rawReviews) {
    const reviewId = (raw.review_id || '').trim();
    const product = (raw.product || '').trim();
    const date = (raw.date || '').trim();
    const reviewText = (raw.review_text || '').trim();

    // Skip empty reviews
    if (!reviewText) {
      cleaned.push({
        reviewId,
        product,
        rating: parseRating(raw.rating),
        date,
        reviewText: '',
        textHash: '',
        status: 'empty',
      });
      skipped++;
      continue;
    }

    const rating = parseRating(raw.rating);
    const textHash = hashText(reviewText);

    // Track duplicates
    if (seenHashes.has(textHash)) {
      const originalId = seenHashes.get(textHash)!;
      if (!duplicateMap.has(textHash)) {
        duplicateMap.set(textHash, [originalId]);
      }
      duplicateMap.get(textHash)!.push(reviewId);
      duplicateCount++;

      // Still add the review but mark it — it will share analysis with the original
      cleaned.push({
        reviewId,
        product,
        rating,
        date,
        reviewText: escapeHtml(reviewText),
        textHash,
        status: 'valid',
      });
      continue;
    }

    seenHashes.set(textHash, reviewId);

    cleaned.push({
      reviewId,
      product,
      rating,
      date,
      reviewText: escapeHtml(reviewText),
      textHash,
      status: 'valid',
    });
  }

  return { cleaned, skipped, duplicateCount, duplicateMap };
}
