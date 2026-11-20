/**
 * Aggregates analytics from analysed reviews.
 * Computes summary statistics, top complaints, top praises,
 * and per-product analytics.
 *
 * CRITICAL RULE:
 * Failed or skipped reviews must NEVER be treated as negative.
 * Sentiment percentages and feedback are calculated strictly from completed analyses.
 */
export function aggregateAnalytics(reviews, stats) {
  // Only completed reviews with valid AI analysis contribute to sentiment analytics
  const completedReviews = reviews.filter(
    (r) => r.analysisStatus === 'completed' && r.analysis !== null
  );

  const completedCount = completedReviews.length;

  // Count sentiments
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let needsReply = 0;

  // Collect summaries by sentiment for top complaints/praises
  const complaints = [];
  const praises = [];

  // Track rating-sentiment agreement
  let ratingComparisons = 0;
  let agreements = 0;

  for (const review of completedReviews) {
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
    if (review.rating !== null && review.rating !== undefined) {
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
  const productMap = new Map();

  for (const review of completedReviews) {
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

    const product = productMap.get(review.product);
    product.total++;
    product[review.analysis.sentiment]++;

    if (review.analysis.sentiment === 'negative') {
      product.issues.push(review.analysis.summary);
    }
  }

  const productAnalytics = Array.from(productMap.entries()).map(
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
      total: stats.totalUploaded,
      completed: completedCount,
      positivePercent:
        completedCount > 0 ? Math.round((sentimentCounts.positive / completedCount) * 100) : 0,
      neutralPercent:
        completedCount > 0 ? Math.round((sentimentCounts.neutral / completedCount) * 100) : 0,
      negativePercent:
        completedCount > 0 ? Math.round((sentimentCounts.negative / completedCount) * 100) : 0,
      needsReply,
      ratingAgreementPercent:
        ratingComparisons > 0 ? Math.round((agreements / ratingComparisons) * 100) : 0,
    },
    topComplaints: complaints.slice(0, 3),
    topPraises: praises.slice(0, 3),
    productAnalytics,
  };
}
