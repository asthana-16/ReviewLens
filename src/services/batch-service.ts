import { analyseReview } from './ai-service';
import { saveAnalysis, batchLookup } from './cache-service';
import type { CleanedReview, AnalysedReview, AIAnalysis, ProcessingStats, AnalysisStatus } from '@/types';

export const BATCH_SIZE = 5;
export const MAX_RETRIES = 3;
export const BASE_DELAY_MS = 1000;

/**
 * Delays execution for the specified milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with jitter.
 */
export function getBackoffDelay(attempt: number, baseDelay = BASE_DELAY_MS): number {
  const exponential = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 250;
  return exponential + jitter;
}

/**
 * Checks if an error is retryable (rate limit HTTP 429 or temporary 5xx errors).
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('resource exhausted') ||
      message.includes('quota') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('unavailable') ||
      message.includes('internal') ||
      message.includes('econnreset') ||
      message.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Analyses a single review with retry logic and exponential backoff for transient errors.
 */
export async function analyseWithRetry(
  reviewText: string,
  apiKey: string,
  customCaller?: (text: string) => Promise<string>
): Promise<AIAnalysis | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await analyseReview(reviewText, apiKey, customCaller);
      return result; // Could be null (schema invalid after 2 tries) or valid analysis
    } catch (error) {
      if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
        const backoffMs = getBackoffDelay(attempt);
        console.warn(
          `Retryable rate limit or server error on attempt ${attempt + 1}/${MAX_RETRIES}. Waiting ${Math.round(backoffMs)}ms before retry...`
        );
        await delay(backoffMs);
        continue;
      }
      console.error(`Non-retryable error or max retries reached:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Processes reviews in batches with rate limit handling and caching.
 *
 * Flow:
 * 1. Filter out empty reviews (marked as 'skipped')
 * 2. Collect unique text hashes from valid reviews
 * 3. Check persistent SQLite cache
 * 4. Send uncached reviews to AI in batches of BATCH_SIZE
 * 5. Save new analyses to SQLite cache
 * 6. Map analyses back to all review instances with accurate statuses
 */
export async function processReviews(
  cleanedReviews: CleanedReview[],
  apiKey: string,
  options?: {
    customCaller?: (text: string) => Promise<string>;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<{
  analysed: AnalysedReview[];
  stats: ProcessingStats;
}> {
  const startTime = Date.now();
  let aiCalls = 0;
  let failed = 0;

  // Step 1: Filter valid reviews that have text
  const validReviews = cleanedReviews.filter((r) => r.status === 'valid' && r.textHash);
  const uniqueHashes = [...new Set(validReviews.map((r) => r.textHash))];

  // Step 2: Batch cache lookup
  const cachedResults = batchLookup(uniqueHashes);
  const cacheHits = cachedResults.size;

  // Step 3: Identify reviews that need AI analysis
  const uncachedHashes = uniqueHashes.filter((h) => !cachedResults.has(h));
  const hashToText = new Map<string, string>();
  for (const review of validReviews) {
    if (uncachedHashes.includes(review.textHash) && !hashToText.has(review.textHash)) {
      hashToText.set(review.textHash, review.reviewText);
    }
  }

  // Step 4: Process uncached reviews in batches
  const newAnalyses = new Map<string, AIAnalysis>();
  const hashesToProcess = Array.from(hashToText.keys());
  const totalToProcess = hashesToProcess.length;

  for (let i = 0; i < hashesToProcess.length; i += BATCH_SIZE) {
    const batch = hashesToProcess.slice(i, i + BATCH_SIZE);

    // Process reviews within the batch
    for (const hash of batch) {
      const text = hashToText.get(hash)!;
      const analysis = await analyseWithRetry(text, apiKey, options?.customCaller);

      if (analysis) {
        newAnalyses.set(hash, analysis);
        saveAnalysis(hash, analysis);
        aiCalls++;
      } else {
        failed++;
        console.error(`Analysis failed for review text hash ${hash.slice(0, 8)}...`);
      }
    }

    // Report progress
    const processed = Math.min(i + BATCH_SIZE, totalToProcess);
    options?.onProgress?.(processed + cacheHits, uniqueHashes.length);

    // Small delay between batches to respect rate limits if more batches remain
    if (i + BATCH_SIZE < hashesToProcess.length) {
      await delay(300);
    }
  }

  // Step 5: Merge all analyses (cached + new)
  const allAnalyses = new Map([...cachedResults, ...newAnalyses]);

  // Step 6: Map analyses back to all review instances
  const analysed: AnalysedReview[] = cleanedReviews.map((review) => {
    // Empty review: skipped, never failed
    if (review.status === 'empty') {
      return {
        ...review,
        analysis: null,
        analysisStatus: 'skipped' as AnalysisStatus,
        isCached: false,
      };
    }

    const analysis = allAnalyses.get(review.textHash) || null;
    const isCached = cachedResults.has(review.textHash);
    const status: AnalysisStatus = analysis ? 'completed' : 'failed';

    // Rating and sentiment mismatch detection
    let ratingMismatch = false;
    if (analysis && review.rating !== null) {
      const isHighRating = review.rating >= 4;
      const isLowRating = review.rating <= 2;
      const isNegative = analysis.sentiment === 'negative';
      const isPositive = analysis.sentiment === 'positive';

      ratingMismatch = (isHighRating && isNegative) || (isLowRating && isPositive);
    }

    return {
      ...review,
      analysis,
      analysisStatus: status,
      isCached,
      ratingMismatch,
    };
  });

  const durationMs = Date.now() - startTime;

  return {
    analysed,
    stats: {
      totalUploaded: cleanedReviews.length,
      totalProcessed: validReviews.length,
      skipped: cleanedReviews.filter((r) => r.status === 'empty').length,
      duplicates: validReviews.length - uniqueHashes.length,
      cacheHits,
      aiCalls,
      failed,
      durationMs,
    },
  };
}
