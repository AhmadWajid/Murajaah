'use client';

import { useState } from 'react';
import { TAJWEED_COLORS, TOPIC_TAILWIND_COLORS, TOPIC_ARABIC_NAMES, TOPIC_ENGLISH_NAMES, TAJWEED_ARABIC_NAMES, TAJWEED_ARABIC_DETAILS, TAJWEED_ENGLISH_DETAILS } from '@/lib/tajweedService';

const RULE_GROUPS: { titleAr: string; titleEn: string; rules: string[] }[] = [
  { titleAr: 'الغُنَّة', titleEn: 'Ghunnah', rules: ['ghunnah'] },
  { titleAr: 'القَلْقَلَة', titleEn: 'Qalqalah', rules: ['qalaqah'] },
  { titleAr: 'الإدغام', titleEn: 'Idgham', rules: ['idgham_ghunnah', 'idgham_wo_ghunnah', 'idgham_mutajanisayn', 'idgham_mutaqaribayn', 'idgham_shafawi'] },
  { titleAr: 'الإخفاء', titleEn: 'Ikhafa', rules: ['ikhafa', 'ikhafa_shafawi'] },
  { titleAr: 'الإقلاب', titleEn: 'Iqlab', rules: ['iqlab'] },
  { titleAr: 'الإظهار', titleEn: 'Izhar', rules: ['izhar', 'izhar_shafawi'] },
  { titleAr: 'المَدّ', titleEn: 'Madd', rules: ['madda_normal', 'madda_permissible', 'madda_obligatory_mottasel', 'madda_obligatory_monfasel', 'madda_necessary', 'madd_al_tamkeen'] },
  { titleAr: 'همزة الوصل / لام شمسية', titleEn: 'Silent', rules: ['ham_wasl', 'laam_shamsiyah', 'slnt'] },
  { titleAr: 'التفخيم / الترقيق', titleEn: 'Tafkheem & Tarqeeq', rules: ['tafkheem', 'tarqeeq'] },
];

export default function TajweedLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button with chevron */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200/50 dark:border-amber-700/25 transition-colors"
        title="Tajweed color legend"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
        </svg>
        Tajweed
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Legend panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[3px]" onClick={() => setIsOpen(false)} />

          {/* Panel — centered, single column */}
          <div className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)] max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-[#1a1f25] border border-amber-200/50 dark:border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200/40 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-arabic text-amber-700 dark:text-amber-300" dir="rtl">قواعد التجويد</span>
                <span className="text-amber-400/30 text-sm">|</span>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Tajweed Rules</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content — single column, scrollable */}
            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {RULE_GROUPS.map((group) => (
                <div key={group.titleEn}>
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-amber-200/30 dark:border-amber-700/20">
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{group.titleEn}</span>
                    <span className="text-sm font-arabic text-amber-700 dark:text-amber-400" dir="rtl">{group.titleAr}</span>
                  </div>

                  {/* Rules */}
                  <div className="space-y-3">
                    {group.rules.map((ruleKey) => {
                      const colorClass = TOPIC_TAILWIND_COLORS[ruleKey] || TAJWEED_COLORS[ruleKey];
                      const arabicName = TAJWEED_ARABIC_NAMES[ruleKey];
                      const arabicDetail = TAJWEED_ARABIC_DETAILS[ruleKey];
                      const englishDetail = TAJWEED_ENGLISH_DETAILS[ruleKey];
                      if (!colorClass) return null;

                      const shortEn = englishDetail?.split(' — ')[0] || '';

                      return (
                        <div key={ruleKey} className="flex items-start gap-3">
                          {/* Color bar */}
                          <div className={`flex-shrink-0 w-1 h-12 rounded-full ${colorClass} bg-current mt-0.5`} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Arabic name + English name */}
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className={`font-arabic text-base font-semibold ${colorClass}`} dir="rtl">
                                {arabicName}
                              </span>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                                {shortEn}
                              </span>
                            </div>
                            {/* Arabic detail */}
                            {arabicDetail && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 font-arabic leading-relaxed mb-0.5" dir="rtl">
                                {arabicDetail}
                              </div>
                            )}
                            {/* English detail */}
                            {englishDetail && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                {englishDetail}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
