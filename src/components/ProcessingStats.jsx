'use client';

import { Activity, Clock, Cpu, Database, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function ProcessingStats({ stats }) {
  const cacheHitRate =
    stats.totalProcessed > 0
      ? Math.round((stats.cacheHits / stats.totalProcessed) * 100)
      : 0;

  const statItems = [
    {
      label: 'Total Uploaded',
      value: stats.totalUploaded,
      sub: `${stats.duplicates} duplicates eliminated`,
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Unique Valid',
      value: stats.totalProcessed,
      sub: 'Passed cleaning & schema',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Cache Hits',
      value: `${stats.cacheHits} (${cacheHitRate}%)`,
      sub: 'Saved AI calls from SQLite',
      icon: Database,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'AI Inference Calls',
      value: stats.aiCalls,
      sub: 'Batched in 5s with backoff',
      icon: Cpu,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'Skipped / Failed',
      value: `${stats.skipped} / ${stats.failed}`,
      sub: 'Empty or malformed rows',
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Processing Time',
      value: `${(stats.durationMs / 1000).toFixed(1)}s`,
      sub: 'Total execution duration',
      icon: Clock,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Execution Telemetry & Cache Performance</h3>
            <p className="text-xs text-slate-500">
              Live statistics showing SQLite cache efficiency, API usage, and pipeline latency
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SQLite Cache Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{item.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
