import { describe, it, expect } from 'vitest';
import {
  isRetryableError,
  getBackoffDelay,
  analyseWithRetry,
  processReviews,
} from '@/services/batch-service';

describe('Batch Processing and Rate Limit Retry Service', () => {
  it('correctly identifies retryable HTTP 429 and 5xx server errors', () => {
    expect(isRetryableError(new Error('HTTP 429: Too Many Requests'))).toBe(true);
    expect(isRetryableError(new Error('Resource has been exhausted (e.g. check quota)'))).toBe(true);
    expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true);
    expect(isRetryableError(new Error('500 Internal Server Error'))).toBe(true);
    expect(isRetryableError(new Error('fetch failed: ECONNRESET'))).toBe(true);

    // Non-retryable permanent client errors
    expect(isRetryableError(new Error('Invalid API key provided'))).toBe(false);
    expect(isRetryableError(new Error('HTTP 400 Bad Request'))).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });

  it('calculates exponential backoff delay with jitter', () => {
    const delay0 = getBackoffDelay(0, 100);
    const delay1 = getBackoffDelay(1, 100);
    const delay2 = getBackoffDelay(2, 100);

    expect(delay0).toBeGreaterThanOrEqual(100);
    expect(delay1).toBeGreaterThan(delay0 - 250);
    expect(delay2).toBeGreaterThanOrEqual(400);
  });

  it('retries when encountering retryable error and succeeds on recovery', async () => {
    let callCount = 0;
    const mockCaller = async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('429 Resource exhausted: rate limit exceeded');
      }
      return JSON.stringify({
        sentiment: 'positive',
        topics: ['quality'],
        summary: 'Excellent durability and fit',
        needs_reply: false,
      });
    };

    const result = await analyseWithRetry('Some review', 'test-key', mockCaller);
    expect(callCount).toBe(2);
    expect(result).not.toBeNull();
    expect(result?.sentiment).toBe('positive');
  });

  it('detects rating and sentiment mismatches (e.g. 5 stars with negative review R008)', async () => {
    const reviews = [
      {
        reviewId: 'R008',
        product: 'Ceramic Coffee Mug',
        rating: 5, // 5 stars
        date: '2026-10-04',
        reviewText: 'Terrible. Both handles came off within a week. Never buying again.',
        textHash: 'hash-r008',
        status: 'valid',
      },
      {
        reviewId: 'R001',
        product: 'Cotton Bedsheet Set',
        rating: 5, // 5 stars matching positive text
        date: '2026-10-02',
        reviewText: 'Super soft fabric, colours did not fade. Worth the price.',
        textHash: 'hash-r001',
        status: 'valid',
      },
    ];

    const mockCaller = async (text) => {
      if (text.includes('Terrible')) {
        return JSON.stringify({
          sentiment: 'negative',
          topics: ['quality'],
          summary: 'Handles broke off within one week',
          needs_reply: true,
        });
      }
      return JSON.stringify({
        sentiment: 'positive',
        topics: ['quality', 'price'],
        summary: 'Soft fabric and colors hold up well',
        needs_reply: false,
      });
    };

    const { analysed } = await processReviews(reviews, 'test-key', {
      customCaller: mockCaller,
    });

    const r008 = analysed.find((r) => r.reviewId === 'R008');
    const r001 = analysed.find((r) => r.reviewId === 'R001');

    // R008 has 5-star rating with negative sentiment -> mismatch detected!
    expect(r008?.ratingMismatch).toBe(true);
    // R001 has 5-star rating with positive sentiment -> no mismatch!
    expect(r001?.ratingMismatch).toBe(false);
  });
});
