'use client';

import React, { useState } from 'react';
import { resetDatabaseWithSeedData, clearAllData } from '@/lib/actions/analytics';
import { getAllTransactionsForExport } from '@/lib/actions/transactions';
import { useToast } from '@/components/ui/Toast';
import {
  Download,
  RotateCcw,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Sparkles,
  Palette,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleExport = async (formatType: 'csv' | 'json') => {
    try {
      const rows = await getAllTransactionsForExport({});
      if (rows.length === 0) {
        error('No data available to export');
        return;
      }

      if (formatType === 'csv') {
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
        link.setAttribute('download', `smartwallet_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success(`Downloaded ${rows.length} records as CSV`);
      } else {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(rows, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `smartwallet_export_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        success(`Downloaded ${rows.length} records as JSON`);
      }
    } catch (err: any) {
      error('Export failed: ' + err.message);
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const res = await resetDatabaseWithSeedData();
      if (res.success) {
        success('Database populated with standard categories and sample transactions');
        setShowResetConfirm(false);
      } else {
        error(res.error || 'Failed to seed database');
      }
    } catch (err: any) {
      error(err.message || 'Error occurred while resetting');
    } finally {
      setIsResetting(false);
    }
  };

  const handleWipeDatabase = async () => {
    setIsWiping(true);
    try {
      const res = await clearAllData();
      if (res.success) {
        success('All transactions and categories deleted. Fresh start ready!');
        setShowWipeConfirm(false);
      } else {
        error(res.error || 'Failed to clear database');
      }
    } catch (err: any) {
      error(err.message || 'Error occurred while clearing database');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-base)' }}>
          Settings &amp; System
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Configure preferences, export backups, customize themes, and maintain the local database
        </p>
      </div>

      <div className="space-y-5">
        {/* Section 0: Theme Customization */}
        <div className="t-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
              <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-base)' }}>Visual Theme</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Switch between modern light and luxury dark-gold interfaces</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              className="p-4 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-98"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: theme === 'dark' ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#07070e] border border-[#d4a843]/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#d4a843]">✦</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-base)' }}>Dark &amp; Gold Edition</h4>
                  {theme === 'dark' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Deep onyx surfaces with warm gold accents and glowing metallic trim.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              className="p-4 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-98"
              style={{
                backgroundColor: theme === 'light' ? 'var(--accent-muted)' : 'var(--bg-surface)',
                borderColor: theme === 'light' ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-[#4f46e5]/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#4f46e5]">☀</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-base)' }}>Light Modern Edition</h4>
                  {theme === 'light' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Crisp white cards, subtle borders, and balanced indigo accents for daytime use.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 1: Data Backup & Export */}
        <div className="t-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
              <Download className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-base)' }}>Data Backup &amp; Export</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Download your complete financial records into portable open formats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center justify-between p-4 rounded-xl border transition-all active:scale-98"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-base)' }}>Export to CSV</h4>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Compatible with Excel &amp; Google Sheets</p>
                </div>
              </div>
              <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>

            <button
              onClick={() => handleExport('json')}
              className="flex items-center justify-between p-4 rounded-xl border transition-all active:scale-98"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
                  <FileCode className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-base)' }}>Export to JSON</h4>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Full relational structured export</p>
                </div>
              </div>
              <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>

        {/* Section 2: Database Status */}
        <div className="t-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-base)' }}>Database Architecture</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cloud-hosted persistent PostgreSQL data layer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Engine:</span>
              <p className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-base)' }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL with Prisma ORM
              </p>
            </div>
            <div className="p-3.5 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Mode:</span>
              <p className="font-mono truncate" style={{ color: 'var(--text-base)' }}>Supabase PostgreSQL (Permanent)</p>
            </div>
          </div>
        </div>

        {/* Section 3: Database Data Control */}
        <div className="t-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-base)' }}>Database Control &amp; Reset</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage data states, wipe for a fresh start, or load demo samples</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fresh Start Card */}
            <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Wipe All Data (Fresh Start)
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Deletes all transactions and categories completely, leaving a blank slate for your own entries.
                </p>
              </div>
              <button
                onClick={() => setShowWipeConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>

            {/* Load Sample Demo Data */}
            <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--accent-border)' }}>
              <div>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  Load Sample Demo Data
                </h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Populates the database with 12 standard categories and 38 realistic sample transactions to preview analytics.
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 t-btn-primary"
              >
                <RotateCcw className="w-4 h-4" />
                Load Demo Dataset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wipe Confirmation Dialog */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowWipeConfirm(false)}
          />
          <div className="relative t-modal rounded-2xl p-6 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>Clear All Data for Fresh Start?</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Permanently removes all transactions and categories</p>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Are you sure? This will delete all existing transactions and categories, leaving a completely blank slate for fresh personal tracking.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                disabled={isWiping}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors t-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeDatabase}
                disabled={isWiping}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                {isWiping && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Wipe &amp; Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Seed Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative t-modal rounded-2xl p-6 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3" style={{ color: 'var(--accent)' }}>
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-base)' }}>Load Demo Dataset?</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Populate categories and sample transactions</p>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This will populate standard expense categories and sample transactions to test the analytics engine and charts.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors t-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 t-btn-primary"
              >
                {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
