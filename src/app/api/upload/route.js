import { NextResponse } from 'next/server';
import { parseCSV, cleanReviews } from '@/services/csv-service';
import { processReviews } from '@/services/batch-service';
import { aggregateAnalytics } from '@/services/analytics-service';

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

    // Step 2: Clean and deduplicate
    const { cleaned, skipped, duplicateCount } = cleanReviews(rawReviews);

    // Step 3: Process with AI (batched, cached)
    const { analysed, stats } = await processReviews(cleaned, apiKey);

    // Update stats with cleaning info
    stats.skipped = skipped;
    stats.duplicates = duplicateCount;

    // Step 4: Aggregate analytics
    const dashboardData = aggregateAnalytics(analysed, stats);

    return NextResponse.json({
      success: true,
      message: `Processed ${stats.totalProcessed} reviews (${stats.cacheHits} cached, ${stats.aiCalls} AI calls, ${stats.failed} failed, ${stats.skipped} skipped, ${stats.duplicates} duplicates)`,
      data: dashboardData,
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
