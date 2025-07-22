// QPC V2 Font Loader - Handles page-specific Quran fonts
export class QPCFontLoader {
  private static instance: QPCFontLoader;
  private loadedFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<boolean>> = new Map();

  private constructor() {}

  static getInstance(): QPCFontLoader {
    if (!QPCFontLoader.instance) {
      QPCFontLoader.instance = new QPCFontLoader();
    }
    return QPCFontLoader.instance;
  }

  // Load the UthmanicHafs_V22 font (single font for all pages)
  async loadPageFont(pageNumber: number): Promise<boolean> {
    const fontName = 'UthmanicHafs_V22';
    
    // Check if this font is already loaded
    if (this.loadedFonts.has(fontName)) {
      return true;
    }

    // Check if there's already a loading promise
    if (this.fontLoadPromises.has(fontName)) {
      return this.fontLoadPromises.get(fontName)!;
    }

    // Load the UthmanicHafs_V22 font
    const loadPromise = this.loadUthmanicFont(fontName);
    this.fontLoadPromises.set(fontName, loadPromise);
    
    const result = await loadPromise;
    if (result) {
      this.loadedFonts.add(fontName);
    }
    
    return result;
  }

  private async loadUthmanicFont(fontName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const fontUrl = 'https://static-cdn.tarteel.ai/qul/fonts/UthmanicHafs_V22.woff2?v=3.3';
      
      const fontFace = new FontFace(
        fontName,
        `url('${fontUrl}') format('woff2')`
      );

      fontFace.load()
        .then((loadedFont) => {
          document.fonts.add(loadedFont);
          resolve(true);
        })
        .catch((error) => {
          console.error('Failed to load UthmanicHafs_V22 font:', error);
          resolve(false);
        });
    });
  }

  // Get font family for any page (all pages use the same UthmanicHafs_V22 font)
  getFontFamily(pageNumber: number): string {
    const fontName = 'UthmanicHafs_V22';
    
    // Check if the UthmanicHafs_V22 font is loaded
    if (this.loadedFonts.has(fontName)) {
      return `'${fontName}', 'Amiri', serif`;
    }
    
    return `'Amiri', serif`;
  }

  // Preload multiple page fonts
  async preloadPageFonts(pageNumbers: number[]): Promise<void> {
    const promises = pageNumbers.map(pageNum => this.loadPageFont(pageNum));
    await Promise.allSettled(promises);
  }

  // Check if the UthmanicHafs_V22 font is loaded
  isPageFontLoaded(pageNumber: number): boolean {
    const fontName = 'UthmanicHafs_V22';
    return this.loadedFonts.has(fontName);
  }




}

// Export singleton instance
export const qpcFontLoader = QPCFontLoader.getInstance(); 