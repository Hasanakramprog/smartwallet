'use client';

import React, { useState } from 'react';
import { TimeRangePreset } from '@/lib/actions/analytics';

const PRESET_LABELS: { value: TimeRangePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

interface DateRangeSelectorProps {
  currentPreset: TimeRangePreset;
  startDate?: string;
  endDate?: string;
  onRangeChange: (preset: TimeRangePreset, startDate?: string, endDate?: string) => void;
}

export function DateRangeSelector({ currentPreset, startDate, endDate, onRangeChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(currentPreset === 'custom');
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');

  const handleSelect = (preset: TimeRangePreset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      onRangeChange('custom', customStart || undefined, customEnd || undefined);
    } else {
      setShowCustom(false);
      onRangeChange(preset);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) onRangeChange('custom', customStart, customEnd);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Horizontal scrollable pill strip */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        {PRESET_LABELS.map((item) => {
          const isActive = currentPreset === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive ? 't-nav-active' : 't-nav-item'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Custom date pickers */}
      {showCustom && (
        <form
          onSubmit={handleApply}
          className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200"
        >
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg text-xs t-input"
            required
          />
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg text-xs t-input"
            required
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all t-btn-primary"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
