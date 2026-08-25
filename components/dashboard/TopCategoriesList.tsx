'use client';

import React from 'react';
import { CategoryBreakdownItem } from '@/lib/actions/analytics';
import { CategoryIcon } from '@/lib/icons';
import { Award } from 'lucide-react';

interface TopCategoriesListProps {
  categories: CategoryBreakdownItem[];
  currencySymbol?: string;
}

export function TopCategoriesList({ categories, currencySymbol = '$' }: TopCategoriesListProps) {
  return (
    <div className="t-card rounded-2xl p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-base)' }}>
            Top Spending
          </h3>
          <p className="hidden sm:block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Highest outflow drivers this period
          </p>
        </div>
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Award className="w-4 h-4" />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-4 my-auto">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 font-mono font-bold text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    #{idx + 1}
                  </span>
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3 h-3" />
                  </div>
                  <span className="font-semibold truncate" style={{ color: 'var(--text-base)' }}>
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {cat.percentage.toFixed(0)}%
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text-base)' }}>
                    {currencySymbol}
                    {cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
