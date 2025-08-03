'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3, Target, User, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AppHeaderProps {
  pageType: 'home' | 'quran';
  // Home page specific props
  onRefresh?: () => void;
  // Quran page specific props (QuranHeader props pass-through)
  quranHeaderComponent?: React.ReactNode;
}

export default function AppHeader({
  pageType,
  onRefresh,
  quranHeaderComponent,
}: AppHeaderProps) {
  const { user, signOut } = useAuth();
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-20 min-w-0 overflow-hidden">
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
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
          </div>

          {/* Page-specific content */}
          {pageType === 'home' ? (
            /* Home page buttons */
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
              
              {/* Auth buttons */}
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
            /* Quran page header content will be injected */
            <div className="flex-1 min-w-0">
              {quranHeaderComponent}
            </div>
          ) : null}
          
          {/* Auth buttons for Quran page */}
          {pageType === 'quran' && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              {user ? (
                <>
                  <Button variant="outline" size="sm" onClick={signOut} className="px-2 sm:px-4">
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                  <Link href="/auth">
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 