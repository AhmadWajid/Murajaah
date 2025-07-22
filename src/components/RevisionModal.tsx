'use client';

interface RevisionModalProps {
  isOpen: boolean;
  revisionInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function RevisionModal({
  isOpen,
  revisionInput,
  onInputChange,
  onSubmit,
  onClose
}: RevisionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl p-8 w-96 shadow-2xl border border-amber-200 dark:border-amber-700 backdrop-blur-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            Add Revision Range
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Enter surah and ayah range (e.g., 2:1-5)
          </p>
        </div>
        <input
          type="text"
          value={revisionInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="2:1-5"
          className="w-full px-4 py-3 border-2 border-amber-300 dark:border-amber-600 rounded-xl bg-white dark:bg-gray-700 text-amber-900 dark:text-amber-100 mb-6 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center font-medium"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl font-medium transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 