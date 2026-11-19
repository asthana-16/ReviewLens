'use client';

import { Sparkles, UploadCloud, ShieldCheck, Zap, BarChart2 } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export default function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 max-w-4xl mx-auto text-center shadow-sm">
      <div className="inline-flex p-4 rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed] mb-6">
        <Sparkles className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-[#1e293b] mb-2">
        Welcome to ReviewLens Dashboard
      </h2>
      <p className="text-sm text-[#64748b] max-w-lg mx-auto mb-8">
        Unlock instant, actionable intelligence from your customer reviews. Detect complaints,
        analyze sentiment across languages, generate empathetic replies, and protect against prompt injection.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 rounded-xl border border-[#f1f5f9] bg-[#f8fafc]/60">
          <div className="flex items-center gap-2 mb-2 text-[#3b82f6]">
            <UploadCloud className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1e293b]">
              Messy Data Resilient
            </h4>
          </div>
          <p className="text-xs text-[#64748b]">
            Safely cleans Hinglish/Hindi text, parses invalid ratings, skips empty rows, and eliminates duplicates.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#f1f5f9] bg-[#f8fafc]/60">
          <div className="flex items-center gap-2 mb-2 text-[#10b981]">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1e293b]">
              Injection Protected
            </h4>
          </div>
          <p className="text-xs text-[#64748b]">
            Reviews like R012 with manipulative instructions are strictly isolated as untrusted data.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#f1f5f9] bg-[#f8fafc]/60">
          <div className="flex items-center gap-2 mb-2 text-[#8b5cf6]">
            <Zap className="w-4 h-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1e293b]">
              Instant SQLite Cache
            </h4>
          </div>
          <p className="text-xs text-[#64748b]">
            SHA-256 hash caching eliminates duplicate AI spend and survives application restarts.
          </p>
        </div>
      </div>

      <button
        onClick={onUploadClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow"
      >
        <UploadCloud className="w-4 h-4" />
        Upload reviews.csv to Begin
      </button>
    </div>
  );
}
