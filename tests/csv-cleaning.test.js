import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCSV, cleanReviews, parseRating, normalizeText, hashText, escapeHtml } from '@/services/csv-service';

describe('CSV Ingestion and Cleaning Service', () => {
  it('correctly handles missing and invalid ratings as null (unknown), not 0', () => {
    // Missing rating
    expect(parseRating(undefined)).toBeNull();
    expect(parseRating(null)).toBeNull();
    expect(parseRating('')).toBeNull();
    expect(parseRating('   ')).toBeNull();

    // Invalid ratings like word "five" or out-of-range numbers
    expect(parseRating('five')).toBeNull();
    expect(parseRating('zero')).toBeNull();
    expect(parseRating('0')).toBeNull(); // Ratings must be 1-5
    expect(parseRating('6')).toBeNull();
    expect(parseRating('3.5')).toBeNull();

    // Valid integer ratings 1-5
    expect(parseRating('1')).toBe(1);
    expect(parseRating('2')).toBe(2);
    expect(parseRating('3')).toBe(3);
    expect(parseRating('4')).toBe(4);
    expect(parseRating('5')).toBe(5);
    expect(parseRating(' 5 ')).toBe(5);
  });

  it('normalizes text and generates consistent SHA-256 hashes', () => {
    const text1 = 'Super soft fabric, colours did not fade. ';
    const text2 = 'super  soft   fabric, colours did not fade.';
    const text3 = 'Different text entirely';

    expect(normalizeText(text1)).toBe('super soft fabric, colours did not fade.');
    expect(normalizeText(text2)).toBe('super soft fabric, colours did not fade.');
    expect(hashText(text1)).toBe(hashText(text2));
    expect(hashText(text1)).not.toBe(hashText(text3));
  });

  it('escapes HTML to prevent XSS injection in reviews', () => {
    const malicious = '<script>alert("xss")</script><b>Love it!</b>';
    const escaped = escapeHtml(malicious);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&lt;b&gt;Love it!&lt;/b&gt;');
  });

  it('detects empty reviews and flags them without crashing', () => {
    const raw = [
      { review_id: 'R001', product: 'Item A', rating: '5', date: '2026-10-01', review_text: 'Great!' },
      { review_id: 'R005', product: 'Item A', rating: '5', date: '2026-10-02', review_text: '' },
      { review_id: 'R006', product: 'Item A', rating: '4', date: '2026-10-03', review_text: '   ' },
    ];

    const { cleaned, skipped } = cleanReviews(raw);
    expect(skipped).toBe(2);
    expect(cleaned).toHaveLength(3);
    expect(cleaned[0].status).toBe('valid');
    expect(cleaned[1].status).toBe('empty');
    expect(cleaned[2].status).toBe('empty');
  });

  it('parses and cleans the actual 30-review assignment dataset completely', () => {
    const csvPath = path.join(process.cwd(), 'reviews.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');

    const { reviews, errors } = parseCSV(csvContent);
    expect(errors).toHaveLength(0);
    expect(reviews).toHaveLength(30);

    const { cleaned, skipped, duplicateCount } = cleanReviews(reviews);

    // R005 is an empty review: review_text is ""
    expect(skipped).toBe(1);
    const emptyReview = cleaned.find((r) => r.reviewId === 'R005');
    expect(emptyReview?.status).toBe('empty');

    // R010 has a missing rating (,,)
    const missingRatingReview = cleaned.find((r) => r.reviewId === 'R010');
    expect(missingRatingReview?.rating).toBeNull();

    // R022 has word rating "five"
    const wordRatingReview = cleaned.find((r) => r.reviewId === 'R022');
    expect(wordRatingReview?.rating).toBeNull();

    // R012 and R015 have identical text (prompt injection duplicate)
    expect(duplicateCount).toBeGreaterThanOrEqual(1);
    const r012 = cleaned.find((r) => r.reviewId === 'R012');
    const r015 = cleaned.find((r) => r.reviewId === 'R015');
    expect(r012?.textHash).toBe(r015?.textHash);

    // R024 has HTML tags <b>Love it!</b> which should be escaped
    const r024 = cleaned.find((r) => r.reviewId === 'R024');
    expect(r024?.reviewText).toContain('&lt;b&gt;Love it!&lt;/b&gt;');
  });
});
