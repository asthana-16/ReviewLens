'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Star,
  Sparkles,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const SENTIMENT_STYLES = {
  positive: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  neutral: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  negative: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function ReviewsTable({ reviews, onReviewUpdate, datasetId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [replyStates, setReplyStates] = useState({});
  const [retryingReviews, setRetryingReviews] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);

  const handleRetryReview = async (review) => {
    setRetryingReviews((prev) => ({ ...prev, [review.reviewId]: true }));
    try {
      const response = await fetch('/api/retry-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.reviewId,
          product: review.product,
          rating: review.rating,
          date: review.date,
          reviewText: review.reviewText,
          textHash: review.textHash,
          datasetId,
        }),
      });

      const result = await response.json();
      if (!result.success || !result.review) {
        throw new Error(result.error || 'Failed to retry review analysis');
      }

      onReviewUpdate?.(result.review);
    } catch (err) {
      alert(`Retry failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRetryingReviews((prev) => ({ ...prev, [review.reviewId]: false }));
    }
  };

  // Unique products
  const products = useMemo(
    () => [...new Set(reviews.map((r) => r.product).filter(Boolean))],
    [reviews]
  );

  // Filtering
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (review.status === 'empty') return false;

      if (filterProduct !== 'all' && review.product !== filterProduct) return false;

      if (
        filterSentiment !== 'all' &&
        review.analysis?.sentiment !== filterSentiment
      )
        return false;

      if (
        filterTopic !== 'all' &&
        !review.analysis?.topics.includes(filterTopic)
      )
        return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          review.reviewId.toLowerCase().includes(query) ||
          review.product.toLowerCase().includes(query) ||
          review.reviewText.toLowerCase().includes(query) ||
          (review.analysis?.summary || '').toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [reviews, filterProduct, filterSentiment, filterTopic, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearchQuery('');
    setFilterProduct('all');
    setFilterSentiment('all');
    setFilterTopic('all');
    setCurrentPage(1);
  };

  const handleGenerateReply = async (review) => {
    if (!review.analysis) return;

    setReplyStates((prev) => ({
      ...prev,
      [review.reviewId]: { loading: true, reply: null, error: null, copied: false },
    }));

    try {
      const response = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.reviewText,
          summary: review.analysis.summary,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setReplyStates((prev) => ({
        ...prev,
        [review.reviewId]: { loading: false, reply: result.reply, error: null, copied: false },
      }));
    } catch (err) {
      setReplyStates((prev) => ({
        ...prev,
        [review.reviewId]: {
          loading: false,
          reply: null,
          error: err instanceof Error ? err.message : 'Failed to generate reply',
          copied: false,
        },
      }));
    }
  };

  const handleCopyReply = async (reviewId, reply) => {
    await navigator.clipboard.writeText(reply);
    setReplyStates((prev) => ({
      ...prev,
      [reviewId]: { ...prev[reviewId], copied: true },
    }));
    setTimeout(() => {
      setReplyStates((prev) => ({
        ...prev,
        [reviewId]: { ...prev[reviewId], copied: false },
      }));
    }, 2000);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterProduct !== 'all' ||
    filterSentiment !== 'all' ||
    filterTopic !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by review text, ID, or summary..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            <select
              value={filterProduct}
              onChange={(e) => {
                setFilterProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filterSentiment}
              onChange={(e) => {
                setFilterSentiment(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            <select
              value={filterTopic}
              onChange={(e) => {
                setFilterTopic(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            >
              <option value="all">All Topics</option>
              <option value="quality">Quality</option>
              <option value="delivery">Delivery</option>
              <option value="price">Price</option>
              <option value="packaging">Packaging</option>
              <option value="support">Support</option>
              <option value="size_fit">Size/Fit</option>
              <option value="other">Other</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-md hover:bg-slate-200/60 transition-colors font-medium"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/60 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Sentiment</th>
              <th className="px-4 py-3">Topics</th>
              <th className="px-4 py-3">AI English Summary</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <p className="font-medium text-sm text-slate-600">No reviews found</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting your search filters.</p>
                </td>
              </tr>
            ) : (
              paginatedReviews.map((review) => {
                const sentimentStyle = review.analysis
                  ? SENTIMENT_STYLES[review.analysis.sentiment]
                  : null;

                return (
                  <tr
                    key={review.reviewId}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* ID & Mismatch Alert */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {review.reviewId}
                        </span>
                        {review.ratingMismatch && (
                          <span
                            title={`Rating Mismatch: Customer assigned ${review.rating}/5 stars, but written feedback expresses ${review.analysis?.sentiment || 'contradictory'} sentiment.`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 cursor-help text-[10px] font-semibold"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span className="hidden xl:inline">Mismatch</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3.5 font-medium text-slate-900 max-w-[160px] truncate">
                      {review.product}
                    </td>

                    {/* Star Rating */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {review.rating !== null ? (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating ? 'fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[11px] font-bold text-slate-700 ml-1">
                            {review.rating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Unknown
                        </span>
                      )}
                    </td>

                    {/* Sentiment Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {review.analysis && sentimentStyle ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${sentimentStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sentimentStyle.dot}`} />
                            {review.analysis.sentiment}
                          </span>
                          {review.isCached && (
                            <span
                              title="Retrieved from persistent SQLite cache without calling Gemini API"
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200"
                            >
                              Cached
                            </span>
                          )}
                        </div>
                      ) : review.analysisStatus === 'skipped' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Skipped (Empty)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            Analysis Failed
                          </span>
                          <button
                            onClick={() => handleRetryReview(review)}
                            disabled={retryingReviews[review.reviewId]}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors disabled:opacity-50"
                            title="Retry AI analysis for this review"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${retryingReviews[review.reviewId] ? 'animate-spin text-indigo-600' : ''}`} />
                            <span>Retry</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Topics */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {review.analysis?.topics.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60"
                          >
                            {t.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* AI English Summary */}
                    <td className="px-4 py-3.5 max-w-[260px]">
                      {review.analysis?.summary ? (
                        <p className="text-slate-800 line-clamp-2 leading-relaxed">
                          {review.analysis.summary}
                        </p>
                      ) : review.analysisStatus === 'skipped' ? (
                        <span className="text-slate-400 italic">Empty review (skipped)</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 italic">
                          <span>Analysis unavailable</span>
                          <button
                            onClick={() => handleRetryReview(review)}
                            disabled={retryingReviews[review.reviewId]}
                            className="not-italic text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Inspect raw review and analysis"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {review.analysis?.needs_reply && (
                          <button
                            onClick={() => handleGenerateReply(review)}
                            disabled={replyStates[review.reviewId]?.loading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-semibold border border-violet-200 transition-colors disabled:opacity-50"
                            title="Generate AI suggested customer support reply"
                          >
                            {replyStates[review.reviewId]?.loading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-violet-600" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-violet-600" />
                            )}
                            <span>Suggest Reply</span>
                          </button>
                        )}
                      </div>

                      {/* Generated Reply Drawer */}
                      {replyStates[review.reviewId]?.reply && (
                        <div className="mt-2 text-left p-3 rounded-lg bg-violet-50/60 border border-violet-200/80 text-xs space-y-2">
                          <div className="flex items-center justify-between text-violet-800 font-semibold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-violet-600" />
                              AI Drafted Response
                            </span>
                            <button
                              onClick={() =>
                                handleCopyReply(
                                  review.reviewId,
                                  replyStates[review.reviewId].reply
                                )
                              }
                              className="text-violet-700 hover:text-violet-900 flex items-center gap-1 text-[11px] font-semibold"
                            >
                              {replyStates[review.reviewId].copied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-slate-700 leading-relaxed italic bg-white p-2.5 rounded border border-violet-100 text-[11px]">
                            &quot;{replyStates[review.reviewId].reply}&quot;
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800">
            {filteredReviews.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-800">{filteredReviews.length}</span> reviews
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Detail Inspection Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                  {selectedReview.reviewId}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {selectedReview.product}
                </span>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta details */}
            <div className="grid grid-cols-3 gap-2 py-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-medium text-[10px]">Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedReview.date}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-medium text-[10px]">Customer Rating</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedReview.rating !== null ? `${selectedReview.rating} / 5 Stars` : 'Unknown'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-slate-400 font-medium text-[10px]">Needs Reply</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedReview.analysis?.needs_reply ? 'Yes (Action Required)' : 'No'}
                </p>
              </div>
            </div>

            {/* Rating Mismatch Alert Banner in Modal */}
            {selectedReview.ratingMismatch && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Rating Contradiction Detected</p>
                  <p className="text-amber-700 mt-0.5 leading-relaxed">
                    The customer assigned a {selectedReview.rating}/5 star rating, but their feedback conveys {selectedReview.analysis?.sentiment} sentiment (e.g. sarcastic praise, or a high star rating mistakenly given on a broken product complaint).
                  </p>
                </div>
              </div>
            )}

            {/* Raw Text vs AI Summary */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Customer Input (Escaped & Sanitized)
                </p>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-slate-800 break-words leading-relaxed">
                  {selectedReview.reviewText}
                </div>
              </div>

              {selectedReview.analysis && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    AI Analysis Result
                  </p>
                  <div className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 text-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Sentiment:</span>
                      <span className="font-bold text-slate-900 capitalize">
                        {selectedReview.analysis.sentiment}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Topics:</span>
                      <span className="text-slate-800">
                        {selectedReview.analysis.topics.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">English Summary:</span>
                      <p className="mt-0.5 text-slate-900 font-medium">
                        {selectedReview.analysis.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
