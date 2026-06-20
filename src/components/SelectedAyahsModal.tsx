'use client';

interface SelectedAyahsModalProps {
  isOpen: boolean;
  selectedAyahs: Set<{surah: number, ayah: number}>;
  pageData: any;
  onClose: () => void;
  onAddForReview: () => void;
  onRemoveAyah: (surah: number, ayah: number) => void;
  onClearAll: () => void;
}

export default function SelectedAyahsModal({
  isOpen,
  selectedAyahs,
  pageData,
  onClose,
  onAddForReview,
  onRemoveAyah,
  onClearAll,
}: SelectedAyahsModalProps) {
  if (!isOpen) return null;

  // Group by surah → sorted ranges
  const groups = (() => {
    const map: Record<number, { surah: number; ayah: number }[]> = {};
    for (const s of Array.from(selectedAyahs)) {
      if (!map[s.surah]) map[s.surah] = [];
      map[s.surah].push(s);
    }
    return Object.entries(map).map(([surahNum, ayahs]) => {
      const sorted = ayahs.sort((a, b) => a.ayah - b.ayah);
      const num = Number(surahNum);
      let name = `Surah ${num}`;
      if (pageData?.ayahs) {
        const found = pageData.ayahs.find((a: any) => a.surah?.number === num);
        if (found) name = found.surah?.englishName || name;
      }
      return { surahNumber: num, name, ayahs: sorted };
    });
  })();

  const total = selectedAyahs.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-[#12161A] rounded-2xl shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)] border border-black/[0.07] dark:border-white/[0.07] overflow-hidden animate-fade-in-up font-sans">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0">
              {total}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                {total === 1 ? '1 verse selected' : `${total} verses selected`}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {groups.length} {groups.length === 1 ? 'surah' : 'surahs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Verse list */}
        <div className="max-h-64 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {groups.map((group) =>
            group.ayahs.map((ayah) => (
              <div
                key={`${ayah.surah}-${ayah.ayah}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Surah number dot */}
                  <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {ayah.surah}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{group.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{ayah.surah}:{ayah.ayah}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveAyah(ayah.surah, ayah.ayah)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 ml-2"
                  title="Remove"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            onClick={onClearAll}
            className="flex-1 h-9 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border border-black/[0.08] dark:border-white/[0.08] transition-all"
          >
            Clear all
          </button>
          <button
            onClick={onAddForReview}
            className="flex-1 h-9 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity shadow-sm shadow-amber-500/20"
          >
            Add for Review
          </button>
        </div>
      </div>
    </div>
  );
}