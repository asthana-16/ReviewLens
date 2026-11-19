'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react';
import type { AnalysedReview, Topic } from '@/types';

interface ReviewsTableProps {
  reviews: AnalysedReview[];
}

const ITEMS_PER_PAGE = 10;

const SENTIMENT_STYLES = {
  positive: 'bg-[#22c55e]/10 text-[#16a34a]',
  neutral: 'bg-[#f59e0b]/10 text-[#d97706]',
  negative: 'bg-[#ef4444]/10 text-[#dc2626]',
};

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [replyStates, setReplyStates] = useState<
    Record<string, { loading: boolean; reply: string | null; error: string | null; copied: boolean }>
  >({});
  const [selectedReview, setSelectedReview] = useState<AnalysedReview | null>(null);

  // Get unique products for filter
  const products = useMemo(
    () => [...new Set(reviews.map((r) => r.product).filter(Boolean))],
    [reviews]
  );

  // Filter and search reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Skip empty reviews in the table
      if (review.status === 'empty') return false;

      // Product filter
      if (filterProduct !== 'all' && review.product !== filterProduct) return false;

      // Sentiment filter
      if (
        filterSentiment !== 'all' &&
        review.analysis?.sentiment !== filterSentiment
      )
        return false;

      // Topic filter
      if (
        filterTopic !== 'all' &&
        !review.analysis?.topics.includes(filterTopic as Topic)
      )
        return false;

      // Search query
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

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Generate AI reply
  const handleGenerateReply = async (review: AnalysedReview) => {
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

  // Copy reply to clipboard
  const handleCopyReply = async (reviewId: string, reply: string) => {
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

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0]">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-[#94a3b8]" />
            <select
              value={filterProduct}
              onChange={(e) => handleFilterChange(setFilterProduct, e.target.value)}
              className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filterSentiment}
              onChange={(e) => handleFilterChange(setFilterSentiment, e.target.value)}
              className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            <select
              value={filterTopic}
              onChange={(e) => handleFilterChange(setFilterTopic, e.target.value)}
              className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">ID</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Product</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Sentiment</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Topics</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Summary</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748b]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#94a3b8]">
                  No reviews match your filters
                </td>
              </tr>
            ) : (
              paginatedReviews.map((review) => (
                <tr
                  key={review.reviewId}
                  className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#64748b]">{review.reviewId}</span>
                    {review.ratingMismatch && (
                      <span title="Rating-sentiment mismatch">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] ml-1 inline-block" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#1e293b] max-w-[150px] truncate">
                    {review.product}
                  </td>
                  <td className="px-4 py-3">
                    {review.rating !== null ? (
                      <span className="text-[#1e293b]">{'⭐'.repeat(review.rating)}</span>
                    ) : (
                      <span className="text-[#94a3b8] text-xs">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {review.analysis ? (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          SENTIMENT_STYLES[review.analysis.sentiment]
                        }`}
                      >
                        {review.analysis.sentiment}
                      </span>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {review.analysis?.topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex px-1.5 py-0.5 bg-[#f1f5f9] text-[#475569] rounded text-xs"
                        >
                          {topic.replace('_', '/')}
                        </span>
                      )) || <span className="text-xs text-[#94a3b8]">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#475569] max-w-[250px] truncate">
                    {review.analysis?.summary || (
                      <span className="text-[#94a3b8] italic">Analysis failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#1e293b] transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {review.analysis?.needs_reply && (
                        <button
                          onClick={() => handleGenerateReply(review)}
                          disabled={replyStates[review.reviewId]?.loading}
                          className="p-1.5 rounded-lg hover:bg-[#7c3aed]/10 text-[#7c3aed] transition-colors disabled:opacity-50"
                          title="Generate AI reply"
                        >
                          {replyStates[review.reviewId]?.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Reply display */}
                    {replyStates[review.reviewId]?.reply && (
                      <div className="mt-2 p-3 bg-[#7c3aed]/5 border border-[#7c3aed]/20 rounded-lg">
                        <p className="text-xs text-[#475569] whitespace-pre-wrap">
                          {replyStates[review.reviewId].reply}
                        </p>
                        <button
                          onClick={() =>
                            handleCopyReply(
                              review.reviewId,
                              replyStates[review.reviewId].reply!
                            )
                          }
                          className="mt-2 flex items-center gap-1 text-xs text-[#7c3aed] hover:text-[#6d28d9]"
                        >
                          {replyStates[review.reviewId].copied ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy reply
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {replyStates[review.reviewId]?.error && (
                      <p className="mt-2 text-xs text-red-500">
                        {replyStates[review.reviewId].error}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0]">
          <p className="text-sm text-[#64748b]">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)} of{' '}
            {filteredReviews.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#64748b]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
              <h3 className="font-semibold text-[#1e293b]">
                Review {selectedReview.reviewId}
              </h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-lg hover:bg-[#f1f5f9]"
              >
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product & Rating */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-[#64748b]">Product</p>
                  <p className="font-medium text-[#1e293b]">{selectedReview.product}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">Rating</p>
                  <p className="font-medium text-[#1e293b]">
                    {selectedReview.rating !== null
                      ? `${'⭐'.repeat(selectedReview.rating)} (${selectedReview.rating}/5)`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b]">Date</p>
                  <p className="font-medium text-[#1e293b]">{selectedReview.date}</p>
                </div>
              </div>

              {/* Original Review */}
              <div>
                <p className="text-xs text-[#64748b] mb-1">Original Review</p>
                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <p className="text-sm text-[#475569]">{selectedReview.reviewText}</p>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedReview.analysis ? (
                <div>
                  <p className="text-xs text-[#64748b] mb-1">AI Analysis</p>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b]">Sentiment:</span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          SENTIMENT_STYLES[selectedReview.analysis.sentiment]
                        }`}
                      >
                        {selectedReview.analysis.sentiment}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#64748b]">Topics:</span>
                      {selectedReview.analysis.topics.map((t) => (
                        <span
                          key={t}
                          className="inline-flex px-1.5 py-0.5 bg-[#e2e8f0] text-[#475569] rounded text-xs"
                        >
                          {t.replace('_', '/')}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className="text-xs text-[#64748b]">Summary: </span>
                      <span className="text-sm text-[#1e293b]">
                        {selectedReview.analysis.summary}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#64748b]">Needs Reply: </span>
                      <span className="text-sm text-[#1e293b]">
                        {selectedReview.analysis.needs_reply ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600">Analysis failed for this review</p>
                </div>
              )}

              {/* Rating Mismatch Warning */}
              {selectedReview.ratingMismatch && (
                <div className="flex items-center gap-2 p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/30">
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                  <p className="text-sm text-[#92400e]">
                    Rating-sentiment mismatch detected: the star rating doesn&apos;t match the
                    review content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
