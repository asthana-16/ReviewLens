'use client';

import {
  BarChart3,
  TrendingUp,
  Minus,
  TrendingDown,
  MessageSquareWarning,
  Sparkles,
} from 'lucide-react';

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
      label: 'Total Reviews',
      value: summary.total.toLocaleString(),
      subtext: `${summary.ratingAgreementPercent}% rating alignment`,
      icon: BarChart3,
      badge: 'Analyzed',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Positive Sentiment',
      value: `${summary.positivePercent}%`,
      subtext: `${Math.round((summary.total * summary.positivePercent) / 100)} satisfied customers`,
      icon: TrendingUp,
      badge: 'Positive',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Neutral Sentiment',
      value: `${summary.neutralPercent}%`,
      subtext: `${Math.round((summary.total * summary.neutralPercent) / 100)} mixed opinions`,
      icon: Minus,
      badge: 'Neutral',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Negative Sentiment',
      value: `${summary.negativePercent}%`,
      subtext: `${Math.round((summary.total * summary.negativePercent) / 100)} critical reviews`,
      icon: TrendingDown,
      badge: 'Attention',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
    {
      label: 'Needs Response',
      value: summary.needsReply.toLocaleString(),
      subtext: 'Actionable support requests',
      icon: MessageSquareWarning,
      badge: 'Pending',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Top row: Icon and Micro-Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            {/* Main Value */}
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{card.label}</p>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{card.subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
