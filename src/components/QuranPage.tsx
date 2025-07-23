'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TajweedText } from './TajweedText';
import { TajweedWord } from '@/lib/tajweedService';
import { SURAH_NAMES } from '@/lib/quran';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { qpcFontLoader } from '@/lib/qpcFontLoader';

interface PageLine {
  page_number: number;
  line_number: number;
  line_type: string;
  is_centered: number;
  first_word_id: number;
  last_word_id: number;
  surah_number: number;
}

interface LineData {
  words: TajweedWord[];
  lineInfo: {
    type: string;
    isCentered: boolean;
    surahNumber: number;
  };
}

interface QuranPageProps {
  className?: string;
}

export function QuranPage({ className = '' }: QuranPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLayout, setPageLayout] = useState<PageLine[]>([]);
  const [lineData, setLineData] = useState<Record<number, LineData>>({});
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);

  const loadPageLayout = async (pageNumber: number) => {
    try {
      const response = await fetch(`/api/tajweed?action=pageLayout&page=${pageNumber}`);
      if (!response.ok) throw new Error('Failed to load page layout');
      const data = await response.json();
      setPageLayout(data.pageLayout || []);
    } catch (error) {
      console.error('Error loading page layout:', error);
    }
  };

  const loadLineWords = async (pageNumber: number, lineNumber: number) => {
    try {
      const response = await fetch(`/api/tajweed?action=pageWords&page=${pageNumber}&line=${lineNumber}`);
      if (!response.ok) throw new Error('Failed to load line words');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading line words:', error);
      return { words: [], lineInfo: { type: 'ayah', isCentered: false, surahNumber: 0 } };
    }
  };

  const loadPageData = async (pageNumber: number) => {
    setLoading(true);
    try {
      console.log(`🔄 Loading page ${pageNumber} data...`);
      
      // Load the page-specific font first
      const fontSuccess = await qpcFontLoader.loadPageFont(pageNumber);
      console.log(`📝 Font loading result for page ${pageNumber}:`, fontSuccess);
      setFontLoaded(fontSuccess);
      
      await loadPageLayout(pageNumber);
      
      // Load words for each ayah line
      const newLineData: Record<number, LineData> = {};
      for (const line of pageLayout) {
        if (line.line_type === 'ayah') {
          const data = await loadLineWords(pageNumber, line.line_number);
          newLineData[line.line_number] = data;
        }
      }
      setLineData(newLineData);
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData(currentPage);
  }, [currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const renderLine = (line: PageLine) => {
    switch (line.line_type) {
      case 'surah_name':
        const surahName = SURAH_NAMES[line.surah_number];
        return (
          <div key={line.line_number} className="text-center py-4">
            <div 
              className="text-2xl font-bold text-green-600 mb-1"
              style={{
                fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(currentPage) : "'qpc-v2-fallback', 'Amiri', serif",
                fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1" : "normal"
              }}
            >
              {surahName?.nameArabic}
            </div>
            <div className="text-sm text-gray-600">
              {surahName?.name} • {surahName?.nameTranslation}
            </div>
          </div>
        );
        
      case 'basmallah':
        return (
          <div key={line.line_number} className="text-center py-4">
            <div 
              className="text-xl text-gray-700 font-medium"
              style={{
                fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(currentPage) : "'qpc-v2-fallback', 'Amiri', serif",
                fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1" : "normal"
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          </div>
        );
        
      case 'ayah':
        const lineDataItem = lineData[line.line_number];
        if (!lineDataItem || lineDataItem.words.length === 0) {
          return (
            <div key={line.line_number} className="py-2">
              <div className="text-gray-400 text-center">Loading...</div>
            </div>
          );
        }
        
        return (
          <div 
            key={line.line_number} 
            className={`py-2 ${lineDataItem.lineInfo.isCentered ? 'text-center' : 'text-right'}`}
            style={{
              fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(currentPage) : "'qpc-v2-fallback', 'Amiri', serif",
              fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1" : "normal"
            }}
          >
            <TajweedText 
              words={lineDataItem.words} 
              className="text-lg leading-relaxed"
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Page Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Page
        </Button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold">Page {currentPage}</h2>
          <p className="text-sm text-gray-600">Quran with Tajweed Rules</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleNextPage}
        >
          Next Page
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Quran Page */}
      <Card className="min-h-[800px]">
        <CardContent className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading page...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {pageLayout.map(renderLine)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Page {currentPage} • {pageLayout.filter(line => line.line_type === 'ayah').length} ayah lines
      </div>
    </div>
  );
} 