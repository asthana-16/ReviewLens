'use client';

import { ThumbsDown, ThumbsUp, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';

interface TopFeedbackProps {
  complaints: string[];
  praises: string[];
}

export default function TopFeedback({ complaints, praises }: TopFeedbackProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top Customer Feedback</h3>
            <p className="text-xs text-slate-500">AI-extracted voice of the customer</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          Ranked by Impact
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Complaints */}
        <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider mb-3">
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Top Complaints</span>
            </div>
            {complaints.length > 0 ? (
              <ul className="space-y-2">
                {complaints.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-rose-100/60 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-6 justify-center">
                <AlertCircle className="w-4 h-4" /> No complaints detected
              </div>
            )}
          </div>
        </div>

        {/* Top Praises */}
        <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Top Praises</span>
            </div>
            {praises.length > 0 ? (
              <ul className="space-y-2">
                {praises.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-emerald-100/60 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-6 justify-center">
                <CheckCircle2 className="w-4 h-4" /> No praises detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
