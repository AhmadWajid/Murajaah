'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface TafsirContentProps {
  content: string;
}

export function TafsirContent({ content }: TafsirContentProps) {
  // Function to detect Arabic text
  const isArabic = (text: string) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  };

  // Function to detect if text is a markdown header
  const isMarkdownHeader = (text: string) => {
    return /^#{1,6}\s/.test(text.trim());
  };

  // Function to format the content with Arabic text on the right
  const formatContent = (text: string) => {
    // Split content into paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Check if this is the first paragraph (title) - make it bold
      const isTitle = index === 0;
      
      // Check if paragraph contains Arabic text
      if (isArabic(paragraph)) {
        // Extract Arabic verses and their translations
        const arabicVerses = paragraph.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+/g);
        const translations = paragraph.match(/\([^)]+\)/g);
        
        if (arabicVerses && translations && arabicVerses.length > 0) {
          // Remove duplicate Arabic verses
          const uniqueArabicVerses = [...new Set(arabicVerses.map(verse => verse.trim()))];
          
          return (
            <div key={index} className="mb-3">
              {/* Arabic verse and translation section */}
              <div className="flex flex-col lg:flex-row gap-3 mb-2">
                {/* English text on the left */}
                <div className="flex-1">
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
                    {translations.map((translation, transIndex) => (
                      <div key={transIndex} className="flex items-start gap-2">
                        <span className={`text-amber-600 dark:text-amber-400 font-medium ${isTitle ? 'text-xl font-bold' : 'text-base'}`}>
                          {translation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Arabic text on the right */}
                <div className="flex-1">
                  <div className="space-y-2">
                    {uniqueArabicVerses.map((verse, verseIndex) => (
                      <div key={verseIndex} className="text-right">
                        <p 
                          className={`leading-loose font-arabic text-amber-900 dark:text-amber-100 ${isTitle ? 'text-2xl font-bold' : 'text-xl'}`}
                          dir="rtl"
                          style={{
                            fontFamily: "'qpc-v2-fallback', 'Amiri', serif",
                            lineHeight: '2.2',
                            textAlign: 'right',
                            wordBreak: 'keep-all',
                            overflowWrap: 'break-word',
                            hyphens: 'none',
                            wordSpacing: '0.1em',
                            fontWeight: isTitle ? '700' : '500',
                          }}
                        >
                          {verse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Any remaining English text */}
              {(() => {
                let remainingText = paragraph;
                uniqueArabicVerses.forEach(verse => {
                  remainingText = remainingText.replace(verse, '');
                });
                translations?.forEach(translation => {
                  remainingText = remainingText.replace(translation, '');
                });
                remainingText = remainingText.trim();
                
                if (remainingText) {
                  return (
                    <div className={`text-gray-700 dark:text-gray-300 leading-relaxed mb-2 ${isTitle ? 'font-bold text-lg' : ''}`}>
                      <ReactMarkdown>
                        {remainingText}
                      </ReactMarkdown>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        } else {
          // Arabic text found but no translations - split into English and Arabic
          const arabicText = paragraph.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+/g);
          if (arabicText && arabicText.length > 0) {
            // Remove duplicate Arabic text
            const uniqueArabicText = [...new Set(arabicText.map(text => text.trim()))];
            const englishText = paragraph.replace(arabicText.join(''), '').trim();
            
            return (
              <div key={index} className="mb-3">
                <div className="flex flex-col lg:flex-row gap-3 mb-2">
                  {/* English text on the left */}
                  <div className="flex-1">
                    <div className={`text-gray-700 dark:text-gray-300 leading-relaxed ${isTitle ? 'font-bold text-lg' : ''}`}>
                      <ReactMarkdown>
                        {englishText}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Arabic text on the right */}
                  <div className="flex-1">
                    <div className="text-right">
                      <p 
                        className={`leading-loose font-arabic text-amber-900 dark:text-amber-100 ${isTitle ? 'text-2xl font-bold' : 'text-xl'}`}
                        dir="rtl"
                        style={{
                          fontFamily: "'qpc-v2-fallback', 'Amiri', serif",
                          lineHeight: '2.2',
                          textAlign: 'right',
                          wordBreak: 'keep-all',
                          overflowWrap: 'break-word',
                          hyphens: 'none',
                          wordSpacing: '0.1em',
                          fontWeight: isTitle ? '700' : '500',
                        }}
                      >
                        {uniqueArabicText.join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        }
      }
      
      // Regular English text - check if it's a markdown header
      if (isMarkdownHeader(paragraph)) {
        return (
          <div key={index} className="mb-3">
            <div className="text-gray-900 dark:text-white font-bold text-xl mb-2">
              <ReactMarkdown>
                {paragraph}
              </ReactMarkdown>
            </div>
          </div>
        );
      }
      
      // Regular English text
      return (
        <div key={index} className="mb-3">
          <div className={`text-gray-700 dark:text-gray-300 leading-relaxed ${isTitle ? 'font-bold text-lg' : ''}`}>
            <ReactMarkdown>
              {paragraph}
            </ReactMarkdown>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="tafsir-content">
      {formatContent(content)}
    </div>
  );
} 