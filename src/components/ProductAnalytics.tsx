'use client';

import { Package, AlertCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { ProductAnalytics as ProductAnalyticsType } from '@/types';

interface ProductAnalyticsProps {
  products: ProductAnalyticsType[];
}

export default function ProductAnalytics({ products }: ProductAnalyticsProps) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 text-center text-[#64748b]">
        No product data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((item) => {
          const positivePct =
            item.total > 0 ? Math.round((item.positive / item.total) * 100) : 0;
          const neutralPct =
            item.total > 0 ? Math.round((item.neutral / item.total) * 100) : 0;
          const negativePct =
            item.total > 0 ? Math.round((item.negative / item.total) * 100) : 0;

          return (
            <div
              key={item.product}
              className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1e293b] leading-tight">
                        {item.product}
                      </h4>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {item.total} {item.total === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar split */}
                <div className="my-3">
                  <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${positivePct}%` }}
                      className="bg-[#22c55e]"
                      title={`Positive: ${positivePct}%`}
                    />
                    <div
                      style={{ width: `${neutralPct}%` }}
                      className="bg-[#f59e0b]"
                      title={`Neutral: ${neutralPct}%`}
                    />
                    <div
                      style={{ width: `${negativePct}%` }}
                      className="bg-[#ef4444]"
                      title={`Negative: ${negativePct}%`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#64748b] mt-1.5 font-medium">
                    <span className="flex items-center gap-1 text-[#16a34a]">
                      <ThumbsUp className="w-3 h-3" /> {positivePct}%
                    </span>
                    <span className="flex items-center gap-1 text-[#d97706]">
                      <Minus className="w-3 h-3" /> {neutralPct}%
                    </span>
                    <span className="flex items-center gap-1 text-[#dc2626]">
                      <ThumbsDown className="w-3 h-3" /> {negativePct}%
                    </span>
                  </div>
                </div>

                {/* Top Issues */}
                <div className="mt-4 pt-3 border-t border-[#f1f5f9]">
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[#ef4444]" />
                    Top Issues
                  </p>
                  {item.topIssues.length > 0 ? (
                    <ul className="space-y-1.5">
                      {item.topIssues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-[#475569] bg-[#f8fafc] border border-[#f1f5f9] px-2.5 py-1.5 rounded"
                        >
                          {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#94a3b8] italic">No major complaints logged</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
