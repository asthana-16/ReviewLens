import type { AnalysedReview, DashboardData, ProcessingStats, ProductAnalytics } from '@/types';

/**
 * Aggregates analytics from analysed reviews.
 * Computes summary statistics, top complaints, top praises,
 * and per-product analytics.
 */
export function aggregateAnalytics(
  reviews: AnalysedReview[],
  stats: ProcessingStats
): DashboardData {
  const analysedReviews = reviews.filter(
    (r) => r.analysis !== null && r.analysisStatus !== 'failed'
  );

  const total = analysedReviews.length;

  // Count sentiments
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let needsReply = 0;

  // Collect summaries by sentiment for top complaints/praises
  const complaints: string[] = [];
  const praises: string[] = [];

  // Track rating-sentiment agreement
  let ratingComparisons = 0;
  let agreements = 0;

  for (const review of analysedReviews) {
    if (!review.analysis) continue;

    sentimentCounts[review.analysis.sentiment]++;

    if (review.analysis.needs_reply) {
      needsReply++;
    }

    if (review.analysis.sentiment === 'negative') {
      complaints.push(review.analysis.summary);
    } else if (review.analysis.sentiment === 'positive') {
      praises.push(review.analysis.summary);
    }

    // Rating agreement check
    if (review.rating !== null) {
      ratingComparisons++;
      const rating = review.rating;
      const sentiment = review.analysis.sentiment;

      const agrees =
        (rating >= 4 && sentiment === 'positive') ||
        (rating === 3 && sentiment === 'neutral') ||
        (rating <= 2 && sentiment === 'negative');

      if (agrees) agreements++;
    }
  }

  // Build per-product analytics
  const productMap = new Map<
    string,
    { total: number; positive: number; neutral: number; negative: number; issues: string[] }
  >();

  for (const review of analysedReviews) {
    if (!review.analysis) continue;

    if (!productMap.has(review.product)) {
      productMap.set(review.product, {
        total: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        issues: [],
      });
    }

    const product = productMap.get(review.product)!;
    product.total++;
    product[review.analysis.sentiment]++;

    if (review.analysis.sentiment === 'negative') {
      product.issues.push(review.analysis.summary);
    }
  }

  const productAnalytics: ProductAnalytics[] = Array.from(productMap.entries()).map(
    ([product, data]) => ({
      product,
      ...data,
      topIssues: data.issues.slice(0, 3),
    })
  );

  return {
    reviews,
    stats,
    summary: {
      total,
      positivePercent: total > 0 ? Math.round((sentimentCounts.positive / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((sentimentCounts.neutral / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((sentimentCounts.negative / total) * 100) : 0,
      needsReply,
      ratingAgreementPercent:
        ratingComparisons > 0 ? Math.round((agreements / ratingComparisons) * 100) : 0,
    },
    topComplaints: complaints.slice(0, 3),
    topPraises: praises.slice(0, 3),
    productAnalytics,
  };
}
