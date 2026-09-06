'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { RefreshCw, BarChart3, Target, User, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AppHeaderProps {
  pageType: 'home' | 'quran';
  onRefresh?: () => void;
  quranHeaderComponent?: React.ReactNode;
}

/**
 * AppHeader — the top-level application header.
 *
 * Design principles:
 *  - One clean sticky bar (no collapse gimmick).
 *  - Clear groups: [Brand] ... [Page-specific toolbar] ... [Account].
 *  - Consistent control heights and radius from the design system.
 *  - Primary action (Add Review) is visually distinct from secondary nav.
 *  - Mobile: lower-priority controls collapse into an overflow menu.
 */
export default function AppHeader({ pageType, onRefresh, quranHeaderComponent }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [quranToolbarOpen, setQuranToolbarOpen] = useState(true);

  const AccountControl = ({ compact = false }: { compact?: boolean }) =>
    user ? (
      <Tooltip label="Sign out">
        <Button
          variant="ghost"
          size={compact ? 'icon-sm' : 'sm'}
          onClick={signOut}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          {!compact && <span>Sign out</span>}
        </Button>
      </Tooltip>
    ) : (
      <Button variant="outline" size={compact ? 'icon-sm' : 'sm'} asChild aria-label="Sign in">
        <Link href="/auth">
          <User className="h-4 w-4" />
          {!compact && <span>Sign in</span>}
        </Link>
      </Button>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-3 min-w-0">
          {/* ── Brand ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-[var(--radius-sm)] focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <div className="size-8 overflow-hidden rounded-[var(--radius-sm)]">
              <Image
                src="/icon.svg"
                alt="Murajaah"
                width={32}
                height={32}
                className="size-full object-cover"
              />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground hidden min-[400px]:inline">
              Murajaah
            </span>
          </Link>

          {/* ── Page-specific toolbar ── */}
          {pageType === 'home' ? (
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Primary action */}
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/quran?addReview=1">
                  <Target className="h-4 w-4" />
                  <span>Add Review</span>
                </Link>
              </Button>

              {/* Secondary nav — desktop */}
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/quran">
                  <BookOpen className="h-4 w-4" />
                  <span>Open Quran</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/statistics">
                  <BarChart3 className="h-4 w-4" />
                  <span>Statistics</span>
                </Link>
              </Button>
              <Tooltip label="Refresh">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={onRefresh}
                  className="hidden md:inline-flex"
                  aria-label="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </Tooltip>

              {/* Overflow — tablet/mobile */}
              <div className="relative md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOverflowOpen((v) => !v)}
                  aria-expanded={overflowOpen}
                  aria-haspopup="menu"
                  aria-label="More actions"
                >
                  <span className="sm:hidden">Menu</span>
                  <span className="hidden sm:inline">More</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                {overflowOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOverflowOpen(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 z-50 w-52 panel-surface rounded-[var(--radius-lg)] p-1 animate-popover"
                    >
                      <Link
                        href="/quran?addReview=1"
                        onClick={() => setOverflowOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium hover:bg-secondary sm:hidden"
                        role="menuitem"
                      >
                        <Target className="h-4 w-4" />
                        Add Review
                      </Link>
                      <Link
                        href="/quran"
                        onClick={() => setOverflowOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-secondary md:hidden"
                        role="menuitem"
                      >
                        <BookOpen className="h-4 w-4" />
                        Open Quran
                      </Link>
                      <Link
                        href="/statistics"
                        onClick={() => setOverflowOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-secondary md:hidden"
                        role="menuitem"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Statistics
                      </Link>
                      <button
                        onClick={() => {
                          onRefresh?.();
                          setOverflowOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-secondary md:hidden"
                        role="menuitem"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0" />
          )}

          {/* ── Account ── */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AccountControl compact={pageType === 'quran'} />
          </div>
        </div>
      </div>

      {/* ── Collapsible Quran toolbar + trapezoid toggle ── */}
      {pageType === 'quran' && (
        <div className="relative">
          {/* Toolbar elements row */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              quranToolbarOpen ? 'max-h-40 opacity-100 border-t border-border' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-wrap items-center justify-center gap-2 py-2 font-sans">
                {quranHeaderComponent}
              </div>
            </div>
          </div>

          {/* Trapezoid toggle tab — sits at the very bottom of the nav bar */}
          <div className="relative h-0">
            {/* Outline layer (slightly larger, behind) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-[23px] z-40 w-[60px] h-[24px] bg-border"
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 78% 100%, 22% 100%)' }}
            />
            {/* Fill layer (on top) */}
            <button
              onClick={() => setQuranToolbarOpen((v) => !v)}
              aria-label={quranToolbarOpen ? 'Hide toolbar' : 'Show toolbar'}
              aria-expanded={quranToolbarOpen}
              className="absolute left-1/2 -translate-x-1/2 -bottom-[22px] z-50 flex items-end justify-center w-14 h-[22px] bg-background hover:bg-secondary transition-colors group"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 78% 100%, 22% 100%)',
              }}
            >
              <ChevronDown className={`h-3 w-3 mb-1 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${quranToolbarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
