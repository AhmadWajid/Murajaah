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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
      <div className="bg-card rounded-[var(--radius-2xl)] p-8 w-96 shadow-2xl border border-border animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Add Revision Range
          </h3>
          <p className="text-sm text-muted-foreground">
            Enter surah and ayah range (e.g., 2:1-5)
          </p>
        </div>
        <input
          type="text"
          value={revisionInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="2:1-5"
          className="w-full px-4 py-3 border border-border rounded-[var(--radius)] bg-input text-foreground mb-6 focus:ring-2 focus:ring-ring/30 focus:border-transparent text-center font-medium outline-none transition-all"
        />
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-[var(--radius)] font-medium transition-colors shadow-lg"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-3 px-4 rounded-[var(--radius)] font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 