'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getCategoriesWithStats,
  deleteCategory,
  CategoryWithStats,
} from '@/lib/actions/categories';
import { CategoryIcon } from '@/lib/icons';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export default function CategoryAdminPage() {
  const { success, error } = useToast();

  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryWithStats | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithStats | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCategoriesWithStats();
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleEdit = (cat: CategoryWithStats) => {
    setCategoryToEdit(cat);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (cat: CategoryWithStats) => {
    setDeleteTarget(cat);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setReassignTargetId(otherCats.length > 0 ? otherCats[0].id : '');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteCategory(
        deleteTarget.id,
        deleteTarget.transactionCount > 0 ? reassignTargetId : undefined
      );

      if (res.success) {
        success(`Category "${deleteTarget.name}" deleted successfully`);
        setDeleteTarget(null);
        loadCategories();
      } else {
        error(res.error || 'Failed to delete category');
      }
    } catch (err: any) {
      error(err.message || 'Error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  const otherCategories = categories.filter((c) => c.id !== deleteTarget?.id);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-base)' }}>
            Category Management
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Create, customize, and manage expense categories with color coding and icon identifiers
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 t-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-medium">Fetching categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 t-card rounded-2xl text-center">
          <Tags className="w-12 h-12 mb-3" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>No Categories Configured</h3>
          <p className="text-xs max-w-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Create your first expense category to start classifying your spending patterns.
          </p>
          <button
            onClick={() => {
              setCategoryToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl shadow-md transition-all t-btn-primary"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-2xl t-card-hover flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Icon, Color Dot, Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-md"
                      style={{
                        backgroundColor: `${cat.color}25`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold transition-colors" style={{ color: 'var(--text-base)' }}>
                        {cat.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[11px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
                          {cat.color}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded-lg transition-colors t-btn-ghost"
                      title="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3.5 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Transactions
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>
                    {cat.transactionCount} {cat.transactionCount === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Total Outflow
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-base)' }}>
                    ${cat.totalSpend.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        onSuccess={() => {
          loadCategories();
        }}
      />

      {/* Delete / Reassignment Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative t-modal rounded-2xl p-6 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>Delete "{deleteTarget.name}"?</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Category Deletion Safety Check</p>
              </div>
            </div>

            {deleteTarget.transactionCount > 0 ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {deleteTarget.transactionCount} Active Transactions Linked
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    To safeguard your historical reports, choose a target category to reassign these transactions to:
                  </p>
                </div>

                {otherCategories.length > 0 ? (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                      Reassign transactions to:
                    </label>
                    <select
                      value={reassignTargetId}
                      onChange={(e) => setReassignTargetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs t-input"
                    >
                      {otherCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-rose-400">
                    Cannot delete this category because it is the only remaining category with active transactions.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Are you sure you want to delete this category? No active transactions are linked.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors t-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || (deleteTarget.transactionCount > 0 && otherCategories.length === 0)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleteTarget.transactionCount > 0 ? 'Reassign & Delete' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
