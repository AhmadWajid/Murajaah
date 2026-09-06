'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

/**
 * TajweedLegend — a quiet tertiary control that opens a centered dialog.
 *
 * Designed to sit inside a ControlGroup as a ghost button so it reads as
 * part of the tools group rather than an independent amber pill.
 */
export default function TajweedLegend() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Trigger — ghost button, matches ControlGroup siblings */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius-sm)] text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Tajweed color legend"
        aria-label="Tajweed color legend"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
        </svg>
        <span className="hidden xl:inline">Tajweed</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Legend dialog — rendered via portal to escape header's backdrop-filter containing block */}
      {isOpen && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] animate-overlay"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)] max-h-[80vh] flex flex-col rounded-[var(--radius-2xl)] bg-card border border-border shadow-2xl animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-arabic text-accent" dir="rtl">قواعد التجويد</span>
                <span className="text-muted-foreground/40 text-sm">|</span>
                <h3 className="text-sm font-semibold text-foreground">Tajweed Rules</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="size-8 flex items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {RULE_GROUPS.map((group) => (
                <div key={group.titleEn}>
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">{group.titleEn}</span>
                    <span className="text-sm font-arabic text-accent" dir="rtl">{group.titleAr}</span>
                  </div>

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
                          <div className={`flex-shrink-0 w-1 self-stretch rounded-full ${colorClass} bg-current`} />

                          <div className="flex-1 min-w-0">
                            {/* English section */}
                            <div className="space-y-0.5">
                              <div className="text-sm font-semibold text-foreground">
                                {shortEn || group.titleEn}
                              </div>
                              {englishDetail && (
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  {englishDetail}
                                </div>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="my-2 h-px bg-border" />

                            {/* Arabic section */}
                            <div className="space-y-0.5 text-right" dir="rtl">
                              {arabicName && (
                                <div className={`font-arabic text-base font-semibold ${colorClass}`}>
                                  {arabicName}
                                </div>
                              )}
                              {arabicDetail && (
                                <div className="text-xs text-muted-foreground font-arabic leading-relaxed">
                                  {arabicDetail}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
