import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCSV, cleanReviews, hashText } from '@/services/csv-service';
import { processReviews } from '@/services/batch-service';
import {
  saveDataset,
  saveDatasetReviews,
  getDataset,
  getDatasetReviews,
  listDatasets,
  clearCache,
  saveAnalysis,
} from '@/services/cache-service';
import { aggregateAnalytics } from '@/services/analytics-service';

describe('Dataset Isolation and Multi-Dataset Pipeline', () => {
  beforeEach(() => {
    clearCache();
  });

  it('runs all 8 dataset isolation, switching, and cache verification scenarios', async () => {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Process and upload original reviews.csv (30 reviews)
    // -------------------------------------------------------------------------
    const csv1Path = path.join(process.cwd(), 'reviews.csv');
    const csv1Content = fs.readFileSync(csv1Path, 'utf8');
    const { reviews: raw1 } = parseCSV(csv1Content);
    const { cleaned: cleaned1, skipped: s1, duplicateCount: d1 } = cleanReviews(raw1);

    const ds1Id = `ds_1_${Date.now()}`;
    const mockCaller = async (text) =>
      JSON.stringify({
        sentiment:
          text.includes('broken') || text.includes('mud') || text.includes('Terrible') || text.includes('died')
            ? 'negative'
            : 'positive',
        topics: ['quality'],
        summary: 'Mocked AI review summary',
        needs_reply: text.includes('broken') || text.includes('died'),
      });

    const { analysed: analysed1, stats: stats1 } = await processReviews(
      cleaned1,
      'test-key',
      { customCaller: mockCaller }
    );
    stats1.skipped = s1;
    stats1.duplicates = d1;

    saveDataset({
      id: ds1Id,
      filename: 'reviews.csv',
      totalUploaded: stats1.totalUploaded,
      totalProcessed: stats1.totalProcessed,
      cacheHits: stats1.cacheHits,
      aiCalls: stats1.aiCalls,
      failed: stats1.failed,
      skipped: stats1.skipped,
      duplicates: stats1.duplicates,
      durationMs: stats1.durationMs,
      summaryJson: aggregateAnalytics(analysed1, stats1).summary,
    });
    saveDatasetReviews(ds1Id, analysed1);

    expect(stats1.totalUploaded).toBe(30);
    expect(stats1.totalProcessed).toBe(29); // R005 is empty
    expect(stats1.skipped).toBe(1);

    // -------------------------------------------------------------------------
    // SCENARIO 2: Upload reviewlens_test_reviews.csv (12 reviews)
    // -------------------------------------------------------------------------
    const csv2Path = path.join(process.cwd(), 'reviewlens_test_reviews.csv');
    const csv2Content = fs.readFileSync(csv2Path, 'utf8');
    const { reviews: raw2 } = parseCSV(csv2Content);
    const { cleaned: cleaned2, skipped: s2, duplicateCount: d2 } = cleanReviews(raw2);

    const ds2Id = `ds_2_${Date.now() + 10}`;

    // Notice: TR001 has identical text to R001 ("Super soft fabric...").
    // Because R001 was processed in Scenario 1 and cached in SQLite, TR001 must hit the cache!
    const { analysed: analysed2, stats: stats2 } = await processReviews(
      cleaned2,
      'test-key',
      { customCaller: mockCaller }
    );
    stats2.skipped = s2;
    stats2.duplicates = d2;

    saveDataset({
      id: ds2Id,
      filename: 'reviewlens_test_reviews.csv',
      totalUploaded: stats2.totalUploaded,
      totalProcessed: stats2.totalProcessed,
      cacheHits: stats2.cacheHits,
      aiCalls: stats2.aiCalls,
      failed: stats2.failed,
      skipped: stats2.skipped,
      duplicates: stats2.duplicates,
      durationMs: stats2.durationMs,
      summaryJson: aggregateAnalytics(analysed2, stats2).summary,
    });
    saveDatasetReviews(ds2Id, analysed2);

    expect(stats2.totalUploaded).toBe(12);
    expect(stats2.totalProcessed).toBe(11); // TR009 is empty
    expect(stats2.skipped).toBe(1);
    expect(stats2.cacheHits).toBeGreaterThanOrEqual(1); // TR001 hit cache!

    // -------------------------------------------------------------------------
    // SCENARIO 3: Verify Dataset 2 displays its OWN reviews
    // -------------------------------------------------------------------------
    const ds2Reviews = getDatasetReviews(ds2Id);
    expect(ds2Reviews.length).toBe(12);
    const ds2Ids = ds2Reviews.map((r) => r.reviewId);
    expect(ds2Ids).toContain('TR001');
    expect(ds2Ids).toContain('TR002');
    expect(ds2Ids).toContain('TR012');
    expect(ds2Ids).not.toContain('R001');
    expect(ds2Ids).not.toContain('R010');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Switch back to first dataset, verify its original results preserved
    // -------------------------------------------------------------------------
    const ds1Reviews = getDatasetReviews(ds1Id);
    expect(ds1Reviews.length).toBe(30);
    const ds1Ids = ds1Reviews.map((r) => r.reviewId);
    expect(ds1Ids).toContain('R001');
    expect(ds1Ids).toContain('R030');
    expect(ds1Ids).not.toContain('TR001');

    const ds1Dataset = getDataset(ds1Id);
    expect(ds1Dataset?.filename).toBe('reviews.csv');
    expect(ds1Dataset?.totalUploaded).toBe(30);

    // -------------------------------------------------------------------------
    // SCENARIO 5 & 6: Re-upload Dataset 2 to verify 100% legitimate cache hits
    // -------------------------------------------------------------------------
    const { stats: stats2Reupload } = await processReviews(
      cleaned2,
      'test-key',
      { customCaller: mockCaller }
    );
    expect(stats2Reupload.cacheHits).toBe(11); // all 11 valid reviews hit cache!
    expect(stats2Reupload.aiCalls).toBe(0); // 0 fresh AI calls needed!

    // -------------------------------------------------------------------------
    // SCENARIO 7: Verify product analytics isolation
    // -------------------------------------------------------------------------
    const ds1Analytics = aggregateAnalytics(ds1Reviews, stats1);
    const ds2Analytics = aggregateAnalytics(ds2Reviews, stats2);

    const ds1Products = ds1Analytics.productAnalytics.map((p) => p.product);
    const ds2Products = ds2Analytics.productAnalytics.map((p) => p.product);

    expect(ds1Products).toContain('Cotton Bedsheet Set');
    expect(ds1Products).toContain('Ceramic Coffee Mug (Set of 2)');
    expect(ds1Products).not.toContain('Mechanical Gaming Keyboard RGB');

    expect(ds2Products).toContain('Mechanical Gaming Keyboard RGB');
    expect(ds2Products).toContain('Wireless Noise-Canceling Headphones');
    expect(ds2Products).not.toContain('Cotton Bedsheet Set');

    // -------------------------------------------------------------------------
    // SCENARIO 8: Verify dataset listing in Processing History
    // -------------------------------------------------------------------------
    const datasetsList = listDatasets();
    expect(datasetsList.length).toBe(2);
    expect(datasetsList[0].id).toBe(ds2Id); // newest first
    expect(datasetsList[1].id).toBe(ds1Id);
  });
});
