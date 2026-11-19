'use client';

import { BarChart3, TrendingUp, Minus, TrendingDown, MessageSquareWarning } from 'lucide-react';

interface SummaryCardsProps {
  summary: {
    total: number;
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
    needsReply: number;
    ratingAgreementPercent: number;
  };
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Analysed',
      value: summary.total,
      icon: BarChart3,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#3b82f6]/10',
    },
    {
      label: 'Positive',
      value: `${summary.positivePercent}%`,
      icon: TrendingUp,
      color: 'text-[#22c55e]',
      bg: 'bg-[#22c55e]/10',
    },
    {
      label: 'Neutral',
      value: `${summary.neutralPercent}%`,
      icon: Minus,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#f59e0b]/10',
    },
    {
      label: 'Negative',
      value: `${summary.negativePercent}%`,
      icon: TrendingDown,
      color: 'text-[#ef4444]',
      bg: 'bg-[#ef4444]/10',
    },
    {
      label: 'Need Reply',
      value: summary.needsReply,
      icon: MessageSquareWarning,
      color: 'text-[#7c3aed]',
      bg: 'bg-[#7c3aed]/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-[#e2e8f0] p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1e293b]">{card.value}</p>
            <p className="text-xs text-[#64748b] mt-1">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
