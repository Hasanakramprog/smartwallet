'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CategoryIcon } from '@/lib/icons';
import { createTransaction, updateTransaction, TransactionWithCategory } from '@/lib/actions/transactions';
import { useToast } from '@/components/ui/Toast';
import { Loader2, ArrowDownLeft, ArrowUpRight, Plus, Calendar, DollarSign, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';

interface CategoryOption {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  onSuccess?: () => void;
  transactionToEdit?: TransactionWithCategory | null;
  onOpenCategoryModal?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  transactionToEdit,
  onOpenCategoryModal,
}: TransactionModalProps) {
  const { success, error } = useToast();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type as 'income' | 'expense');
      setAmount(transactionToEdit.amount.toString());
      setDate(format(new Date(transactionToEdit.date), 'yyyy-MM-dd'));
      setDescription(transactionToEdit.description || '');
      setCategoryId(transactionToEdit.categoryId || '');
    } else {
      setType('expense');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setDescription('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
    }
  }, [transactionToEdit, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      error('Please enter a valid positive amount');
      return;
    }

    if (type === 'expense' && !categoryId) {
      error('Please select an expense category');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        date: new Date(date),
        description: description.trim() || undefined,
        categoryId: type === 'expense' ? categoryId : null,
      };

      if (transactionToEdit) {
        const res = await updateTransaction(transactionToEdit.id, payload);
        if (res.success) {
          success('Transaction updated successfully');
          onSuccess?.();
          onClose();
        } else {
          error(res.error || 'Failed to update transaction');
        }
      } else {
        const res = await createTransaction(payload);
        if (res.success) {
          success(`${type === 'income' ? 'Income' : 'Expense'} recorded successfully`);
          onSuccess?.();
          onClose();
        } else {
          error(res.error || 'Failed to record transaction');
        }
      }
    } catch (err: any) {
      error(err.message || 'An error occurred while saving transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
      description="Track and log your personal finance cash flows"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle: Income vs Expense */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-xl border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            Income
          </button>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-base font-semibold t-input"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium t-input"
                required
              />
            </div>
          </div>
        </div>

        {/* Category Selection (Only for Expenses) */}
        {type === 'expense' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Expense Category
              </label>
              {onOpenCategoryModal && (
                <button
                  type="button"
                  onClick={onOpenCategoryModal}
                  className="text-xs flex items-center gap-1 font-medium transition-colors t-text-accent"
                >
                  <Plus className="w-3 h-3" /> New Category
                </button>
              )}
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-xl border no-scrollbar"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg text-left transition-all border active:scale-95"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-card)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                      color: isSelected ? 'var(--text-base)' : 'var(--text-muted)',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate flex-1">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="p-3.5 rounded-xl border flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400">Income Entry</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Income is tracked directly as positive inflow towards your cash balance.
              </p>
            </div>
          </div>
        )}

        {/* Description / Memo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Description / Memo (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery run, Bonus payout, Coffee..."
              maxLength={255}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm t-input"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-colors t-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 t-btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {transactionToEdit ? 'Save Changes' : 'Record Transaction'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
