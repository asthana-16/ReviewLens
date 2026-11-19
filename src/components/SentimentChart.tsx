'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  summary: {
    total: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    ratingAgreementPercent: number;
  };
}

const COLORS = {
  Positive: '#22c55e',
  Neutral: '#f59e0b',
  Negative: '#ef4444',
};

export default function SentimentChart({ summary }: SentimentChartProps) {
  const data = [
    { name: 'Positive', value: summary.positivePercent },
    { name: 'Neutral', value: summary.neutralPercent },
    { name: 'Negative', value: summary.negativePercent },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Sentiment Distribution</h3>

      <div className="flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value}%`, '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 flex-1">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[entry.name as keyof typeof COLORS],
                  }}
                />
                <span className="text-sm text-[#64748b]">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-[#1e293b]">{entry.value}%</span>
            </div>
          ))}

          {/* Rating Agreement */}
          <div className="pt-3 border-t border-[#e2e8f0]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">Rating-Sentiment Agreement</span>
              <span className="text-sm font-semibold text-[#1e293b]">
                {summary.ratingAgreementPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
