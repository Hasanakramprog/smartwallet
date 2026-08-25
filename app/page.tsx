'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getDashboardData,
  DashboardData,
  TimeRangePreset,
} from '@/lib/actions/analytics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { TopCategoriesList } from '@/components/dashboard/TopCategoriesList';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { CategoryIcon } from '@/lib/icons';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [preset, setPreset] = useState<TimeRangePreset>('this_month');
  const [customStart, setCustomStart] = useState<string | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardData({
        timeRange: preset,
        startDate: customStart,
        endDate: customEnd,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRangeChange = (
    newPreset: TimeRangePreset,
    newStart?: string,
    newEnd?: string
  ) => {
    setPreset(newPreset);
    setCustomStart(newStart);
    setCustomEnd(newEnd);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-4">
      {/* Page Title + Date Range Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-base)' }}>
              Financial Overview
            </h1>
            {data && (
              <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(data.dateRange.startDate), 'MMM d')} –{' '}
                {format(new Date(data.dateRange.endDate), 'MMM d, yyyy')} ·{' '}
                {data.dateRange.daysCount}d
              </p>
            )}
          </div>
          {loading && data && (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: 'var(--accent)' }} />
          )}
        </div>
        <DateRangeSelector
          currentPreset={preset}
          startDate={customStart}
          endDate={customEnd}
          onRangeChange={handleRangeChange}
        />
      </div>

      {/* Initial loading state */}
      {loading && !data ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Loading analytics...</p>
        </div>
      ) : data ? (
        <>
          {/* ── 4 Metric Cards ─────────────────────────────── */}
          {/* 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              title="Income"
              value={`$${data.summary.income.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
              subValue={`${data.summary.transactionCount} entries`}
              delta={data.summary.incomeDelta}
              icon={TrendingUp}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
            />
            <MetricCard
              title="Expenses"
              value={`$${data.summary.expenses.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
              delta={data.summary.expenseDelta}
              icon={TrendingDown}
              iconColor="text-rose-400"
              iconBg="bg-rose-500/10 border-rose-500/20"
              invertDeltaColor={true}
            />
            <MetricCard
              title="Net Balance"
              value={`$${data.summary.netBalance.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
              subValue={data.summary.netBalance >= 0 ? '↑ Positive' : '↓ Deficit'}
              delta={data.summary.netDelta}
              icon={Wallet}
              iconColor={data.summary.netBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}
              iconBg={
                data.summary.netBalance >= 0
                  ? 'bg-indigo-500/10 border-indigo-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
              }
            />
            <MetricCard
              title="Savings Rate"
              value={`${data.summary.savingsRate.toFixed(1)}%`}
              subValue={
                data.summary.savingsRate >= 30
                  ? 'Excellent'
                  : data.summary.savingsRate >= 15
                  ? 'Healthy'
                  : 'Tight'
              }
              icon={PiggyBank}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10 border-amber-500/20"
            />
          </div>

          {/* ── Smart Insights ─────────────────────────────── */}
          <InsightsPanel insights={data.insights} />

          {/* ── Charts Row ─────────────────────────────────── */}
          {/* Stacked on mobile, side-by-side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-8">
              <IncomeExpenseChart data={data.timeSeries} />
            </div>
            <div className="lg:col-span-4">
              <TopCategoriesList categories={data.topCategories} />
            </div>
          </div>

          {/* ── Donut + Recent Activity ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-6">
              <CategoryDonutChart
                categories={data.categoryBreakdown}
                totalExpense={data.summary.expenses}
              />
            </div>

            {/* Recent Transactions Panel */}
            <div className="t-card rounded-2xl p-4 sm:p-6 lg:col-span-6 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold tracking-tight" style={{ color: 'var(--text-base)' }}>
                    Recent Activity
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest financial movements</p>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 t-text-accent"
                >
                  All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentTransactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>No transactions yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tap "Add Entry" to get started</p>
                </div>
              ) : (
                <div className="divide-y flex-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  {data.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                          }`}
                          style={
                            tx.category?.color && tx.type === 'expense'
                              ? {
                                  backgroundColor: `${tx.category.color}18`,
                                  borderColor: `${tx.category.color}35`,
                                  color: tx.category.color,
                                }
                              : {}
                          }
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <CategoryIcon name={tx.category?.icon} className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-base)' }}>
                            {tx.description ||
                              tx.category?.name ||
                              (tx.type === 'income' ? 'Income Entry' : 'Expense')}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(tx.date), 'MMM d')} ·{' '}
                            {tx.type === 'income'
                              ? 'Income'
                              : tx.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}$
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Link
                  href="/transactions"
                  className="block w-full text-center text-xs font-semibold py-1 rounded-xl transition-colors t-btn-ghost"
                >
                  View All Transactions →
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
