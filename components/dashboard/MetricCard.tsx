import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  invertDeltaColor?: boolean;
}

export function MetricCard({
  title,
  value,
  subValue,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor = 'text-indigo-400',
  iconBg = 'bg-indigo-500/10 border-indigo-500/20',
  invertDeltaColor = false,
}: MetricCardProps) {
  const hasDelta = delta !== undefined && !isNaN(delta);
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;

  let deltaTextColor = 'var(--text-muted)';
  let deltaBg = 'var(--bg-elevated)';
  let deltaBorder = 'var(--border-subtle)';

  if (hasDelta) {
    const good = invertDeltaColor ? isNegative : isPositive;
    const bad  = invertDeltaColor ? isPositive : isNegative;
    if (good) {
      deltaTextColor = 'var(--income-color)';
      deltaBg    = 'rgba(16,185,129,0.08)';
      deltaBorder = 'rgba(16,185,129,0.2)';
    } else if (bad) {
      deltaTextColor = 'var(--expense-color)';
      deltaBg    = 'rgba(239,68,68,0.08)';
      deltaBorder = 'rgba(239,68,68,0.2)';
    }
  }

  return (
    <div className="t-card-hover rounded-2xl p-3.5 sm:p-5">
      {/* Icon + Title */}
      <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
        <span
          className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider leading-tight"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </span>
        <div className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      {/* Value */}
      <div
        className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-none"
        style={{ color: 'var(--text-base)' }}
      >
        {value}
      </div>

      {/* Sub-value */}
      {subValue && (
        <div className="text-[10px] sm:text-xs font-medium mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
          {subValue}
        </div>
      )}

      {/* Delta badge */}
      {hasDelta && (
        <div className="mt-2 sm:mt-3">
          <div
            className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border"
            style={{ color: deltaTextColor, backgroundColor: deltaBg, borderColor: deltaBorder }}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{delta.toFixed(1)}%</span>
          </div>
          {deltaLabel && (
            <span className="hidden sm:inline text-[10px] ml-1.5" style={{ color: 'var(--text-muted)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
