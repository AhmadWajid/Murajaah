'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3, Target, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AppHeaderProps {
  pageType: 'home' | 'quran';
  onRefresh?: () => void;
  quranHeaderComponent?: React.ReactNode;
}

export default function AppHeader({
  pageType,
  onRefresh,
  quranHeaderComponent,
}: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 relative">
      {/* Header content — collapses entirely */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? 'max-h-0 border-b-0' : 'max-h-[400px] border-b border-gray-200 dark:border-gray-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile: stacked vertically. Desktop: single row. */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between min-w-0 py-2 sm:min-h-20">
            {/* Row 1 on mobile: Logo. On desktop: left side. */}
            <div className="flex items-center justify-between sm:justify-start sm:space-x-6 flex-shrink-0 mb-2 sm:mb-0">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 overflow-hidden">
                  <Image
                    src="/icon.svg"
                    alt="Murajaah Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden min-[380px]:block">
                  <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Murajaah
                  </span>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">
                    Quran Review & Memorization
                  </div>
                </div>
              </Link>

              {/* Auth button on mobile — sits at the right edge of the logo row */}
              {pageType === 'quran' && (
                <div className="flex items-center gap-2 sm:hidden">
                  {user ? (
                    <Button variant="outline" size="sm" onClick={signOut} className="px-2">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="px-2">
                      <Link href="/auth">
                        <User className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Row 2+ on mobile: toolbar. On desktop: fills remaining space. */}
            {pageType === 'home' ? (
              <div className="flex gap-1 sm:gap-3">
                <Button variant="outline" size="sm" onClick={onRefresh} className="px-2 sm:px-4">
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                  <Link href="/statistics">
                    <BarChart3 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Statistics</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                  <Link href="/quran">
                    <span className="hidden sm:inline">Open Quran</span>
                    <span className="sm:hidden">Quran</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                  <Link href="/quran?addReview=1">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Review</span>
                  </Link>
                </Button>
                {user ? (
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                    <Button variant="outline" size="sm" onClick={signOut} className="px-2 sm:px-4">
                      <LogOut className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                    <Link href="/auth">
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Login</span>
                    </Link>
                  </Button>
                )}
              </div>
            ) : pageType === 'quran' ? (
              <div className="flex-1 min-w-0 flex items-center">
                <div className="flex-1 min-w-0">
                  {quranHeaderComponent}
                </div>
                {/* Auth button on desktop — at the far right, after the Quran toolbar */}
                <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
                  {user ? (
                    <Button variant="outline" size="sm" onClick={signOut} className="px-2 sm:px-4">
                      <LogOut className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                      <Link href="/auth">
                        <User className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Login</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Trapezoid tab — wide base on the border line, pointing down below */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="header-tab absolute top-full left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        title={collapsed ? "Show top bar" : "Hide top bar"}
      >
        <ChevronDown
          className={`w-5 h-5 text-white transition-transform duration-200 mt-1 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
    </header>
  );
}
