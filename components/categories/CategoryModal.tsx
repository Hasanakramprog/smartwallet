'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { COLOR_PRESETS, AVAILABLE_ICONS, CategoryIcon } from '@/lib/icons';
import { createCategory, updateCategory } from '@/lib/actions/categories';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Sparkles, Check } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categoryToEdit?: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryModalProps) {
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('Tag');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setColor(categoryToEdit.color || '#6366f1');
      setIcon(categoryToEdit.icon || 'Tag');
    } else {
      setName('');
      setColor('#6366f1');
      setIcon('Tag');
    }
  }, [categoryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        const res = await updateCategory(categoryToEdit.id, { name, color, icon });
        if (res.success) {
          success(`Updated "${name}" category`);
          onSuccess?.();
          onClose();
        } else {
          error(res.error || 'Failed to update category');
        }
      } else {
        const res = await createCategory({ name, color, icon });
        if (res.success) {
          success(`Created "${name}" category`);
          onSuccess?.();
          onClose();
        } else {
          error(res.error || 'Failed to create category');
        }
      }
    } catch (err: any) {
      error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIcons = Object.keys(AVAILABLE_ICONS).filter((iconKey) =>
    iconKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Category' : 'New Expense Category'}
      description="Organize your spending into distinct, trackable categories"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Name & Live Preview */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Category Name &amp; Live Preview
          </label>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-lg transition-colors"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              <CategoryIcon name={icon} className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dining Out, Gym, Groceries..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium t-input"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Color Picker Swatches */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Color Theme
          </label>
          <div className="grid grid-cols-7 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                  color.toLowerCase() === preset.toLowerCase()
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105 shadow-md'
                    : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: preset }}
              >
                {color.toLowerCase() === preset.toLowerCase() && (
                  <Check className="w-4 h-4 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Custom Hex:</span>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#6366f1"
              maxLength={7}
              className="w-28 px-2.5 py-1 rounded-lg text-xs font-mono uppercase t-input"
            />
          </div>
        </div>

        {/* Icon Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Select Icon
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search icons..."
              className="px-2.5 py-1 rounded-lg text-xs w-36 t-input"
            />
          </div>

          <div
            className="grid grid-cols-8 gap-2 p-2.5 rounded-xl border max-h-40 overflow-y-auto no-scrollbar"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            {filteredIcons.map((iconName) => {
              const isSelected = icon.toLowerCase() === iconName.toLowerCase();
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  title={iconName}
                  className="p-2 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? 'var(--text-on-accent)' : 'var(--text-muted)',
                  }}
                >
                  <CategoryIcon name={iconName} className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
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
                <Sparkles className="w-4 h-4" />
                {categoryToEdit ? 'Save Changes' : 'Create Category'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
