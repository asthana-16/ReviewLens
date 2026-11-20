import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { parseCSV, cleanReviews } from '@/services/csv-service';
import { processReviews } from '@/services/batch-service';
import { aggregateAnalytics } from '@/services/analytics-service';
import { saveDataset, saveDatasetReviews } from '@/services/cache-service';

// Allow up to 60 seconds execution time on Vercel Hobby serverless functions
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Maximum upload size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  try {
    // Check API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: AI API key not set' },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || typeof file.text !== 'function') {
      return NextResponse.json(
        { success: false, error: 'No valid file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Only CSV files are accepted' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    const filename = (file.name || 'uploaded_reviews.csv').trim();

    // Read file content
    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    // Step 1: Parse CSV
    const { reviews: rawReviews, errors: parseErrors } = parseCSV(csvContent);

    if (parseErrors.length > 0 && rawReviews.length === 0) {
      return NextResponse.json(
        { success: false, error: `CSV parsing failed: ${parseErrors.join(', ')}` },
        { status: 400 }
      );
    }

    if (rawReviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No reviews found in the CSV file' },
        { status: 400 }
      );
    }

    // Generate unique dataset ID for complete dataset isolation
    const datasetId = `ds_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const uploadTimestamp = new Date().toISOString();

    // Step 2: Clean and deduplicate
    const { cleaned, skipped, duplicateCount } = cleanReviews(rawReviews);

    // Step 3: Process with AI (batched, cached)
    const { analysed, stats } = await processReviews(cleaned, apiKey);

    // Update stats with cleaning info
    stats.skipped = skipped;
    stats.duplicates = duplicateCount;

    // Step 4: Aggregate analytics
    const dashboardData = aggregateAnalytics(analysed, stats);

    // Step 5: Persist isolated dataset and reviews in SQLite
    saveDataset({
      id: datasetId,
      filename,
      totalUploaded: stats.totalUploaded,
      totalProcessed: stats.totalProcessed,
      cacheHits: stats.cacheHits,
      aiCalls: stats.aiCalls,
      failed: stats.failed,
      skipped: stats.skipped,
      duplicates: stats.duplicates,
      durationMs: stats.durationMs,
      createdAt: uploadTimestamp,
      summaryJson: dashboardData.summary,
    });

    saveDatasetReviews(datasetId, analysed);

    return NextResponse.json({
      success: true,
      message: `Processed ${stats.totalProcessed} reviews (${stats.cacheHits} cached, ${stats.aiCalls} AI calls, ${stats.failed} failed, ${stats.skipped} skipped, ${stats.duplicates} duplicates)`,
      datasetId,
      data: {
        ...dashboardData,
        dataset: {
          id: datasetId,
          filename,
          createdAt: uploadTimestamp,
        },
      },
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing the file. Please try again.',
      },
      { status: 500 }
    );
  }
}
