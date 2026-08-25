'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TimeSeriesPoint } from '@/lib/actions/analytics';
import { BarChart3, TrendingUp } from 'lucide-react';

interface IncomeExpenseChartProps {
  data: TimeSeriesPoint[];
  currencySymbol?: string;
}

export function IncomeExpenseChart({ data, currencySymbol = '$' }: IncomeExpenseChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenseVal = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const netVal = incomeVal - expenseVal;

      return (
        <div className="t-modal p-3.5 rounded-xl shadow-2xl" style={{ minWidth: 180 }}>
          <p className="text-xs font-semibold mb-2 pb-1.5 border-b" style={{ color: 'var(--text-base)', borderColor: 'var(--border-subtle)' }}>{label}</p>
          <div className="space-y-1 text-xs font-medium">
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Income
              </span>
              <span className="font-bold">
                {currencySymbol}{incomeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Expenses
              </span>
              <span className="font-bold">
                {currencySymbol}{expenseVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="pt-1.5 mt-1 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-base)' }}>
              <span>Net</span>
              <span className={`font-bold ${netVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netVal >= 0 ? '+' : ''}{currencySymbol}{netVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="t-card rounded-2xl p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-base)' }}>Income vs. Expense Trend</h3>
          <p className="hidden sm:block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Revenue inflow and outflow trajectory</p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'area'
                ? 't-nav-active'
                : 't-nav-item'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Area
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'bar'
                ? 't-nav-active'
                : 't-nav-item'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Bar
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-52 sm:h-72 lg:h-80">
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">No activity recorded in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} opacity={0.5} />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} opacity={0.5} />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Footer */}
      <div
        className="flex items-center justify-center gap-4 sm:gap-6 mt-3 pt-3 border-t text-[11px] sm:text-xs font-medium"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-md bg-emerald-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-md bg-rose-500" />
          <span>Expenses</span>
        </div>
      </div>
    </div>
  );
}
