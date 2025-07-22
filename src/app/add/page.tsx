'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import QuranSelector from '@/components/QuranSelector';

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Remove unused isAdding state

  // Get the surah parameter from URL if it exists
  const surahParam = searchParams.get('surah');
  const currentSurah = surahParam ? parseInt(surahParam) : 1;

  const handleAdd = () => {
    // Remove setIsAdding call
    // Redirect back to the dashboard after successful addition
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Add for Review
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select Quran Passage
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose the surah and ayah range you want to add for review. The system will use spaced repetition to help you review at optimal intervals.
            </p>
          </div>

          <QuranSelector onAdd={handleAdd} currentSurah={currentSurah} />
        </Card>
      </main>
    </div>
  );
} 