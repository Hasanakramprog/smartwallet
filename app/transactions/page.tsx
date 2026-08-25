'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getTransactions,
  deleteTransaction,
  getAllTransactionsForExport,
  TransactionWithCategory,
  GetTransactionsResponse,
} from '@/lib/actions/transactions';
import { getCategories } from '@/lib/actions/categories';
import { CategoryIcon } from '@/lib/icons';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { useToast } from '@/components/ui/Toast';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileCode,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { success, error } = useToast();

  const [data, setData] = useState<GetTransactionsResponse>({
    transactions: [],
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    summary: { incomeTotal: 0, expenseTotal: 0, netBalance: 0 },
  });
  const [categories, setCategories] = useState<{ id: string; name: string; color: string; icon: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionWithCategory | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategoryList = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactions({
        type,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [type, categoryId, search, startDate, endDate, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchCategoryList();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleEdit = (tx: TransactionWithCategory) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const res = await deleteTransaction(deleteConfirmId);
      if (res.success) {
        success('Transaction removed successfully');
        setDeleteConfirmId(null);
        loadTransactions();
      } else {
        error(res.error || 'Failed to delete transaction');
      }
    } catch (err: any) {
      error(err.message || 'Error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const rows = await getAllTransactionsForExport({
        type,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });

      if (rows.length === 0) {
        error('No transactions available to export');
        return;
      }

      const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Description'];
      const csvContent = [
        headers.join(','),
        ...rows.map((r) =>
          [
            `"${r.id}"`,
            `"${r.date}"`,
            `"${r.type}"`,
            r.amount,
            `"${r.category}"`,
            `"${(r.description || '').replace(/"/g, '""')}"`,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `smartwallet_transactions_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success(`Exported ${rows.length} transactions to CSV`);
    } catch (err: any) {
      error('Failed to export CSV: ' + err.message);
    }
  };

  const handleExportJSON = async () => {
    try {
      const rows = await getAllTransactionsForExport({
        type,
        categoryId: categoryId === 'all' ? undefined : categoryId,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });

      if (rows.length === 0) {
        error('No transactions available to export');
        return;
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(rows, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `smartwallet_transactions_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      success(`Exported ${rows.length} transactions to JSON`);
    } catch (err: any) {
      error('Failed to export JSON: ' + err.message);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-base)' }}>Transactions Log</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Search, filter, audit, and export your cash flows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center t-card rounded-xl p-1">
            <button
              onClick={handleExportCSV}
              title="Export filtered transactions to CSV"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors t-btn-ghost"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              title="Export filtered transactions to JSON"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors t-btn-ghost"
            >
              <FileCode className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              JSON
            </button>
          </div>

          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="t-card rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Search Input (4 Cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search memo or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs t-input"
            />
          </div>

          {/* Type Filter (2 Cols) */}
          <div className="lg:col-span-2">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as any); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl text-xs t-input"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category Filter (3 Cols) */}
          <div className="lg:col-span-3">
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl text-xs t-input"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By & Order (3 Cols) */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-1/2 px-2.5 py-2 rounded-xl text-xs t-input"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-1/2 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors t-btn-ghost"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> Range:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2 py-1 rounded-lg text-xs t-input"
          />
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2 py-1 rounded-lg text-xs t-input"
          />
          {(startDate || endDate || search || type !== 'all' || categoryId !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setType('all');
                setCategoryId('all');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="ml-auto text-xs font-medium underline underline-offset-2 t-text-accent"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="t-card rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Inflow</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400">
            +${data.summary.incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="t-card rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Outflow</span>
          <span className="text-xs sm:text-sm font-bold text-rose-400">
            -${data.summary.expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="t-card rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Net</span>
          <span className={`text-xs sm:text-sm font-bold ${data.summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.summary.netBalance >= 0 ? '+' : ''}$
            {data.summary.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="t-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-xs font-medium">Loading transactions...</p>
          </div>
        ) : data.transactions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ color: 'var(--text-muted)' }}>
            <Filter className="w-8 h-8 opacity-50" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-base)' }}>No transactions found</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or click Add to record an entry</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b text-xs font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description / Memo</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {data.transactions.map((tx) => (
                    <tr key={tx.id} className="transition-colors group hover:bg-[var(--bg-surface)]">
                      <td className="py-3 px-4 font-medium whitespace-nowrap" style={{ color: 'var(--text-base)' }}>
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                            tx.type === 'income'
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                              Income
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-rose-400" />
                              Expense
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.type === 'income' ? (
                          <span className="italic" style={{ color: 'var(--text-muted)' }}>Direct Revenue</span>
                        ) : tx.category ? (
                          <div
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border"
                            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                          >
                            <div
                              className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${tx.category.color}25`, color: tx.category.color }}
                            >
                              <CategoryIcon name={tx.category.icon} className="w-2.5 h-2.5" />
                            </div>
                            <span className="font-semibold" style={{ color: 'var(--text-base)' }}>{tx.category.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Uncategorized</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium max-w-xs truncate" style={{ color: 'var(--text-base)' }}>
                        {tx.description || <span className="italic" style={{ color: 'var(--text-muted)' }}>No memo</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm whitespace-nowrap">
                        <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.type === 'income' ? '+' : '-'}$
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1.5 rounded-lg transition-colors t-btn-ghost"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Native Card View (block md:hidden) */}
            <div className="block md:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {data.transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
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
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <CategoryIcon name={tx.category?.icon} className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-base)' }}>
                        {tx.description || tx.category?.name || (tx.type === 'income' ? 'Income Entry' : 'Expense')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{format(new Date(tx.date), 'MMM d')}</span>
                        <span>•</span>
                        <span className="truncate">
                          {tx.type === 'income' ? 'Income' : tx.category?.name || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold block ${
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

                    <div className="flex items-center">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        <div
          className="p-3.5 sm:p-4 border-t flex items-center justify-between gap-2 text-xs"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <div>
            Page <strong style={{ color: 'var(--text-base)' }}>{data.currentPage}</strong> of{' '}
            <strong style={{ color: 'var(--text-base)' }}>{data.totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border t-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages || loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border t-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        categories={categories}
        transactionToEdit={transactionToEdit}
        onSuccess={() => {
          loadTransactions();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative t-modal rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>Delete Transaction?</h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors t-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
