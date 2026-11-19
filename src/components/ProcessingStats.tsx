'use client';

import { Activity, Clock, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProcessingStats as ProcessingStatsType } from '@/types';

interface ProcessingStatsProps {
  stats: ProcessingStatsType;
}

export default function ProcessingStats({ stats }: ProcessingStatsProps) {
  const cacheHitRate =
    stats.totalProcessed > 0
      ? Math.round((stats.cacheHits / stats.totalProcessed) * 100)
      : 0;

  const statItems = [
    {
      label: 'Uploaded',
      value: stats.totalUploaded,
      icon: Activity,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#3b82f6]/10',
    },
    {
      label: 'Processed',
      value: stats.totalProcessed,
      icon: CheckCircle2,
      color: 'text-[#10b981]',
      bg: 'bg-[#10b981]/10',
    },
    {
      label: 'Cache Hits',
      value: `${stats.cacheHits} (${cacheHitRate}%)`,
      icon: Database,
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#8b5cf6]/10',
    },
    {
      label: 'AI Calls',
      value: stats.aiCalls,
      icon: Cpu,
      color: 'text-[#0ea5e9]',
      bg: 'bg-[#0ea5e9]/10',
    },
    {
      label: 'Skipped / Failed',
      value: `${stats.skipped} / ${stats.failed}`,
      icon: AlertCircle,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#f59e0b]/10',
    },
    {
      label: 'Duration',
      value: `${(stats.durationMs / 1000).toFixed(1)}s`,
      icon: Clock,
      color: 'text-[#64748b]',
      bg: 'bg-[#64748b]/10',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f1f5f9]">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">Processing Activity & Performance</h3>
          <p className="text-xs text-[#64748b] mt-0.5">
            Real-time telemetry on caching, AI inference, and execution speed
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#059669]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          Active Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc]/50 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded-md ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-xs text-[#64748b] font-medium">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-[#1e293b]">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
