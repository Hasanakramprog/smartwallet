'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdownItem } from '@/lib/actions/analytics';
import { CategoryIcon } from '@/lib/icons';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryDonutChartProps {
  categories: CategoryBreakdownItem[];
  totalExpense: number;
  currencySymbol?: string;
}

export function CategoryDonutChart({ categories, totalExpense, currencySymbol = '$' }: CategoryDonutChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryBreakdownItem;
      return (
        <div className="t-modal p-3 rounded-xl shadow-2xl" style={{ minWidth: 160 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>{data.name}</span>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>
            {currencySymbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {data.percentage.toFixed(1)}% · {data.transactionCount} entries
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="t-card rounded-2xl p-4 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-base)' }}>
            Expense by Category
          </h3>
          <p className="hidden sm:block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Spending distribution breakdown
          </p>
        </div>
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
        >
          <PieIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No expenses in this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Donut */}
          <div className="h-48 sm:h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categories.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Total
              </span>
              <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-base)' }}>
                {currencySymbol}
                {totalExpense >= 10000 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Legend list */}
          <div className="space-y-2 max-h-44 sm:max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-xl transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text-base)' }}>
                    {cat.name}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold" style={{ color: 'var(--text-base)' }}>
                    {currencySymbol}{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{cat.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
