'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TajweedWord,
  TAJWEED_COLORS,
  TOPIC_TAILWIND_COLORS,
  getTajweedRuleInfo,
  getTajweedWords,
} from '@/lib/tajweedService';

interface TajweedBreakdownModalProps {
  surah: number;
  ayah: number;
  onClose: () => void;
}

interface RuleBreakdown {
  ruleClass: string;
  count: number;
  samples: string[]; // distinct letters the rule applies to, in order of appearance
  hukumLabel?: string;   // Arabic, e.g. "المد الطبيعي الكلمي"
  ruleLabel?: string;    // Arabic, e.g. "الألف الساكنة المسبوقة بحرف مفتوح"
  topicLabel?: string;   // Arabic, e.g. "المد"
  hukumLabelEn?: string; // English, e.g. "Natural Madd (Madd Tabi'i — 2 counts)"
  topicLabelEn?: string; // English, e.g. "Prolongation (Madd)"
  ruleLabelEn?: string;  // English, e.g. "Sukoon alef preceded by a fatha letter"
}

export function TajweedBreakdownModal({ surah, ayah, onClose }: TajweedBreakdownModalProps) {
  const [rules, setRules] = useState<RuleBreakdown[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTajweedWords(surah, ayah)
      .then((words: TajweedWord[]) => {
        if (cancelled) return;
        // Merge cross-word rules: a rule reaching the end of one word that
        // continues as the same class at the start of the next word is one occurrence
        const occurrences: { ruleClass: string; text: string; touchesEnd: boolean; hukumLabel?: string; ruleLabel?: string; topicLabel?: string; hukumLabelEn?: string; topicLabelEn?: string; ruleLabelEn?: string }[] = [];
        words.forEach((word) => {
          (word.tajweedRules || []).forEach((rule, i) => {
            const prev = occurrences[occurrences.length - 1];
            const isContinuation =
              i === 0 && rule.startIndex === 0 && !!prev && prev.touchesEnd && prev.ruleClass === rule.class;
            if (isContinuation) {
              prev.text += ' ' + rule.text;
              prev.touchesEnd = rule.endIndex === word.text.length;
            } else {
              occurrences.push({
                ruleClass: rule.class,
                text: rule.text,
                touchesEnd: rule.endIndex === word.text.length,
                hukumLabel: rule.hukumLabel,
                ruleLabel: rule.ruleLabel,
                topicLabel: rule.topicLabel,
                hukumLabelEn: rule.hukumLabelEn,
                topicLabelEn: rule.topicLabelEn,
                ruleLabelEn: rule.ruleLabelEn,
              });
            }
          });
        });

        // Group by hukumLabel when available (specific ruling), else by ruleClass (topic)
        const byClass = new Map<string, RuleBreakdown>();
        occurrences.forEach(({ ruleClass, text, hukumLabel, ruleLabel, topicLabel, hukumLabelEn, topicLabelEn, ruleLabelEn }) => {
          const groupKey = hukumLabel || ruleClass;
          const existing = byClass.get(groupKey);
          if (existing) {
            existing.count++;
            if (!existing.samples.includes(text) && existing.samples.length < 5) {
              existing.samples.push(text);
            }
          } else {
            byClass.set(groupKey, { ruleClass, count: 1, samples: [text], hukumLabel, ruleLabel, topicLabel, hukumLabelEn, topicLabelEn, ruleLabelEn });
          }
        });
        setRules(Array.from(byClass.values()));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRules([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [surah, ayah]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md max-h-[80vh] shadow-2xl border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-sans">
              Tajweed Rules
            </h3>
            <span className="text-lg font-bold font-arabic text-amber-700 dark:text-amber-400">
              أحكام التجويد
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              {surah}:{ayah}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground font-sans">Analyzing ayah…</p>
            </div>
          ) : !rules || rules.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground font-sans">
              No tajweed rules found in this ayah.
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const info = getTajweedRuleInfo(rule.ruleClass);
                const colorClass = TOPIC_TAILWIND_COLORS[rule.ruleClass] || TAJWEED_COLORS[rule.ruleClass] || 'text-gray-600';
                const dotClass = colorClass.replace('text-', 'bg-');
                const [englishName, englishDesc] = info.english.split(' - ');
                // Prefer the specific English hukum name from the engine, fall back to the generic one
                const displayName = rule.hukumLabelEn || englishName;
                return (
                  <div
                    key={rule.hukumLabel || rule.ruleClass + '-' + idx}
                    className="flex items-start gap-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.02] p-3"
                  >
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 font-sans">
                          {displayName}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-arabic text-sm text-amber-700 dark:text-amber-400" dir="rtl">
                            {rule.hukumLabel || info.arabicName}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground font-sans">
                            ×{rule.count}
                          </span>
                        </div>
                      </div>
                      {/* Specific rule description from the quranpedia corpus (Arabic) */}
                      {rule.ruleLabel ? (
                        <div className="font-arabic text-xs text-gray-600 dark:text-gray-400 mt-0.5" dir="rtl">
                          {rule.ruleLabel}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-sans mt-0.5">
                          {info.englishDetail || englishDesc}
                        </div>
                      )}
                      {/* English rule description */}
                      {rule.ruleLabelEn && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 font-sans mt-0.5">
                          {rule.ruleLabelEn}
                        </div>
                      )}
                      {info.arabicDetail && !rule.ruleLabel && (
                        <div className="font-arabic text-xs text-muted-foreground mt-0.5" dir="rtl">
                          {info.arabicDetail}
                        </div>
                      )}
                      {rule.samples.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap" dir="rtl">
                          {rule.samples.map((sample, i) => (
                            <span
                              key={i}
                              className={`font-arabic text-base ${colorClass}`}
                              style={{ fontFamily: "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif" }}
                            >
                              {sample}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!loading && rules && rules.length > 0 && (
          <div className="p-3 border-t text-center text-[11px] text-muted-foreground font-sans">
            Hover over colored letters in the ayah for the same labels
          </div>
        )}
      </Card>
    </div>
  );
}
