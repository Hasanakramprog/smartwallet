'use client';

import React from 'react';
import { InsightItem } from '@/lib/insights/engine';
import {
  Sparkles, AlertTriangle, TrendingUp, PiggyBank,
  AlertCircle, PieChart, Zap, Calendar, CreditCard,
  PlusCircle, Lightbulb,
} from 'lucide-react';

const INSIGHT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle, TrendingUp, PiggyBank, AlertCircle,
  PieChart, Zap, Calendar, CreditCard, PlusCircle,
};

type InsightType = 'info' | 'success' | 'warning' | 'danger';

const TYPE_STYLES: Record<InsightType, { icon: string; badge: string; badgeBg: string; badgeBorder: string; border: string }> = {
  info: {
    icon: 'text-indigo-400', badge: 'text-indigo-400',
    badgeBg: 'rgba(99,102,241,0.1)', badgeBorder: 'rgba(99,102,241,0.2)',
    border: 'rgba(99,102,241,0.15)',
  },
  success: {
    icon: 'text-emerald-400', badge: 'text-emerald-400',
    badgeBg: 'rgba(16,185,129,0.08)', badgeBorder: 'rgba(16,185,129,0.2)',
    border: 'rgba(16,185,129,0.15)',
  },
  warning: {
    icon: 'text-amber-400', badge: 'text-amber-400',
    badgeBg: 'rgba(245,158,11,0.1)', badgeBorder: 'rgba(245,158,11,0.2)',
    border: 'rgba(245,158,11,0.15)',
  },
  danger: {
    icon: 'text-rose-400', badge: 'text-rose-400',
    badgeBg: 'rgba(239,68,68,0.08)', badgeBorder: 'rgba(239,68,68,0.2)',
    border: 'rgba(239,68,68,0.15)',
  },
};

export function InsightsPanel({ insights }: { insights: InsightItem[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="t-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-base)' }}>
              Smart Tips &amp; Insights
            </h3>
            <p className="hidden sm:block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Automated rule-based analysis of your cash flow
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
        >
          {insights.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((item) => {
          const IconComp = INSIGHT_ICONS[item.iconName] || Sparkles;
          const s = TYPE_STYLES[(item.type as InsightType) || 'info'];
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between p-4 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${s.border}`,
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-1.5 rounded-lg border shrink-0"
                      style={{ backgroundColor: s.badgeBg, borderColor: s.badgeBorder }}
                    >
                      <IconComp className={`w-4 h-4 ${s.icon}`} />
                    </div>
                    <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-base)' }}>
                      {item.title}
                    </h4>
                  </div>
                  {item.metric && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 border"
                      style={{ color: s.badge, backgroundColor: s.badgeBg, borderColor: s.badgeBorder }}
                    >
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {item.message}
                </p>
              </div>

              {item.actionableTip && (
                <div
                  className="mt-3 pt-3 flex items-start gap-2 text-[11px] border-t"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{item.actionableTip}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
