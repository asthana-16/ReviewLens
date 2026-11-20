import { NextResponse } from 'next/server';
import { analyseReview } from '@/services/ai-service';
import { saveAnalysis } from '@/services/cache-service';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: AI API key not set' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { reviewId, product, rating, date, reviewText, textHash } = body;

    if (!reviewText || !textHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      );
    }

    // Call Gemini AI for single review analysis
    const analysis = await analyseReview(reviewText, apiKey);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'AI analysis failed or response schema was invalid. Please try again.' },
        { status: 502 }
      );
    }

    // Persist successful analysis in SQLite cache
    saveAnalysis(textHash, analysis);

    // Calculate rating mismatch
    let ratingMismatch = false;
    if (rating !== null && rating !== undefined) {
      const isHighRating = rating >= 4;
      const isLowRating = rating <= 2;
      const isNegative = analysis.sentiment === 'negative';
      const isPositive = analysis.sentiment === 'positive';
      ratingMismatch = (isHighRating && isNegative) || (isLowRating && isPositive);
    }

    const updatedReview = {
      reviewId,
      product,
      rating: rating ?? null,
      date,
      reviewText,
      textHash,
      status: 'valid',
      analysis,
      analysisStatus: 'completed',
      isCached: false,
      ratingMismatch,
    };

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error('Retry review error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze review',
      },
      { status: 500 }
    );
  }
}
