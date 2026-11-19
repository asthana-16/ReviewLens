'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';

interface TopFeedbackProps {
  complaints: string[];
  praises: string[];
}

export default function TopFeedback({ complaints, praises }: TopFeedbackProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Top Customer Feedback</h3>

      <div className="space-y-6">
        {/* Top Complaints */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="w-4 h-4 text-[#ef4444]" />
            <span className="text-xs font-medium text-[#ef4444] uppercase tracking-wide">
              Top Complaints
            </span>
          </div>
          {complaints.length > 0 ? (
            <ul className="space-y-2">
              {complaints.map((complaint, i) => (
                <li
                  key={i}
                  className="text-sm text-[#475569] pl-4 border-l-2 border-[#ef4444]/30"
                >
                  {complaint}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#94a3b8] italic">No complaints found</p>
          )}
        </div>

        {/* Top Praises */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="w-4 h-4 text-[#22c55e]" />
            <span className="text-xs font-medium text-[#22c55e] uppercase tracking-wide">
              Top Praises
            </span>
          </div>
          {praises.length > 0 ? (
            <ul className="space-y-2">
              {praises.map((praise, i) => (
                <li
                  key={i}
                  className="text-sm text-[#475569] pl-4 border-l-2 border-[#22c55e]/30"
                >
                  {praise}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#94a3b8] italic">No praises found</p>
          )}
        </div>
      </div>
    </div>
  );
}
