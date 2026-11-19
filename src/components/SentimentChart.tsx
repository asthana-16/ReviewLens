'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, ShieldCheck } from 'lucide-react';

interface SentimentChartProps {
  summary: {
    total: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    ratingAgreementPercent: number;
  };
}

const SENTIMENT_CONFIG = [
  {
    name: 'Positive',
    key: 'positivePercent',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
  },
  {
    name: 'Neutral',
    key: 'neutralPercent',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-700',
  },
  {
    name: 'Negative',
    key: 'negativePercent',
    color: '#ef4444',
    bgColor: 'bg-rose-500',
    textColor: 'text-rose-700',
  },
];

export default function SentimentChart({ summary }: SentimentChartProps) {
  const chartData = SENTIMENT_CONFIG.map((cfg) => ({
    name: cfg.name,
    value: summary[cfg.key as keyof typeof summary] as number,
    color: cfg.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Sentiment Distribution</h3>
            <p className="text-xs text-slate-500">Global breakdown across verified reviews</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {summary.total} Total
        </span>
      </div>

      {/* Chart & Legend Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut Chart */}
        <div className="w-full h-44 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, 'Share']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                itemStyle={{ color: '#ffffff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-slate-900 leading-none">
              {summary.positivePercent}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-600 tracking-wider mt-0.5">
              Positive
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-3">
          {SENTIMENT_CONFIG.map((cfg) => {
            const val = summary[cfg.key as keyof typeof summary] as number;
            return (
              <div key={cfg.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.bgColor}`} />
                  <span className="font-medium text-slate-700">{cfg.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cfg.bgColor}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 w-8 text-right">{val}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Rating Agreement */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-slate-600">Rating-Sentiment Agreement</span>
        </div>
        <span className="text-xs font-bold text-slate-900 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
          {summary.ratingAgreementPercent}% Correlated
        </span>
      </div>
    </div>
  );
}
