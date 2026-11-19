'use client';

import { Package, AlertCircle, ThumbsUp, ThumbsDown, Minus, Sparkles } from 'lucide-react';
import type { ProductAnalytics as ProductAnalyticsType } from '@/types';

interface ProductAnalyticsProps {
  products: ProductAnalyticsType[];
}

export default function ProductAnalytics({ products }: ProductAnalyticsProps) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 max-w-lg mx-auto shadow-sm">
        <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">No product analytics logged yet</p>
        <p className="text-xs text-slate-400 mt-1">Upload a CSV dataset to view per-product sentiment breakdowns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {item.product}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {item.total} {item.total === 1 ? 'review' : 'reviews'} analysed
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {positivePct}% Positive
                  </span>
                </div>

                {/* Progress bar split */}
                <div className="my-4">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      style={{ width: `${positivePct}%` }}
                      className="bg-emerald-500 rounded-l-full"
                      title={`Positive: ${positivePct}%`}
                    />
                    <div
                      style={{ width: `${neutralPct}%` }}
                      className="bg-amber-500"
                      title={`Neutral: ${neutralPct}%`}
                    />
                    <div
                      style={{ width: `${negativePct}%` }}
                      className="bg-rose-500 rounded-r-full"
                      title={`Negative: ${negativePct}%`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-2 font-semibold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ThumbsUp className="w-3 h-3" /> {positivePct}%
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Minus className="w-3 h-3" /> {neutralPct}%
                    </span>
                    <span className="flex items-center gap-1 text-rose-600">
                      <ThumbsDown className="w-3 h-3" /> {negativePct}%
                    </span>
                  </div>
                </div>

                {/* Top Issues List */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    Top Logged Complaints
                  </p>
                  {item.topIssues.length > 0 ? (
                    <ul className="space-y-1.5">
                      {item.topIssues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-slate-700 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg leading-relaxed flex items-start gap-1.5"
                        >
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Zero critical issues detected for this product.
                    </div>
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
