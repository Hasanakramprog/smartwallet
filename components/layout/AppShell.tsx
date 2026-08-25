'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Settings,
  Plus,
  Wallet,
  Database,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { getCategories } from '@/lib/actions/categories';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string; icon: string | null }[]>([]);

  const fetchCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenTransactionModal = () => {
    fetchCategories();
    setIsTxModalOpen(true);
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-base)' }}>

      {/* ── Sticky Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 t-header border-b">

        {/* Row 1: Brand + Controls */}
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-[1.5px] group-hover:scale-105 transition-transform shadow-lg"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #d4a843 0%, #b8860b 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              }}
            >
              <div
                className="w-full h-full rounded-[10px] flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <Wallet
                  className="w-4 h-4"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </div>
            <div className="hidden xs:flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-base)' }}>
                SmartWallet
              </span>
              <span
                className="text-[9px] px-1.5 py-px rounded font-mono font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                Local
              </span>
            </div>
            <span className="xs:hidden font-extrabold text-sm" style={{ color: 'var(--text-base)' }}>SW</span>
          </Link>

          {/* Desktop center nav (md+) */}
          <nav
            className="hidden md:flex items-center gap-0.5 p-1 rounded-xl border flex-1 max-w-md mx-auto"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 ${
                    isActive ? 't-nav-active' : 't-nav-item'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark (Gold) theme'}
              className="p-2 rounded-xl t-btn-ghost border t-border-subtle transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              ) : (
                <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              )}
            </button>

            {/* Add Entry button */}
            <button
              onClick={handleOpenTransactionModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 t-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add Entry</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation Bar (md:hidden) ────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t t-header shadow-lg"
        style={{
          borderColor: 'var(--border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 flex-1 transition-all active:scale-95"
              >
                {/* Active top glow indicator */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 8px var(--accent)',
                    }}
                  />
                )}
                <Icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                <span
                  className="text-[10px] font-semibold whitespace-nowrap transition-colors"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop Footer ─────────────────────────────────── */}
      <footer
        className="hidden md:flex py-4 px-6 text-xs items-center justify-between gap-2 max-w-7xl w-full mx-auto border-t"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5" style={{ color: 'var(--income-color)' }} />
          <span>Local SQLite · Data stays on your device</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>
            {isDark ? '✦ Dark · Gold Edition' : '☀ Light · Indigo Edition'}
          </span>
        </div>
      </footer>

      {/* ── Global Modals ──────────────────────────────────── */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        categories={categories}
        onSuccess={() => fetchCategories()}
        onOpenCategoryModal={() => {
          setIsTxModalOpen(false);
          setIsCatModalOpen(true);
        }}
      />
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSuccess={() => fetchCategories()}
      />
    </div>
  );
}
