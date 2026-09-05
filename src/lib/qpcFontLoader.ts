// QPC Font Loader - Handles page-specific Quran fonts
// Supports both V2 (UthmanicHafs_V22) and V4 (KFGQPC COLRv1 Tajweed) fonts.
// V4 fonts have tajweed colors baked into the font glyphs themselves,
// eliminating the need for span-splitting that breaks Arabic ligatures.
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

  // Load the UthmanicHafs_V22 font (single font for all pages, V2)
  async loadPageFont(pageNumber: number): Promise<boolean> {
    const fontName = 'UthmanicHafs_V22';

    if (this.loadedFonts.has(fontName)) {
      return true;
    }

    if (this.fontLoadPromises.has(fontName)) {
      return this.fontLoadPromises.get(fontName)!;
    }

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

  // Load a V4 Tajweed COLRv1 font for a specific page.
  // Each page has its own font file with word glyphs that include tajweed colors.
  async loadV4PageFont(pageNumber: number): Promise<boolean> {
    const paddedPage = String(pageNumber).padStart(3, '0');
    const fontName = `QCF4${paddedPage}`;

    if (this.loadedFonts.has(fontName)) {
      return true;
    }

    if (this.fontLoadPromises.has(fontName)) {
      return this.fontLoadPromises.get(fontName)!;
    }

    const loadPromise = this.loadV4Font(fontName, paddedPage);
    this.fontLoadPromises.set(fontName, loadPromise);

    const result = await loadPromise;
    if (result) {
      this.loadedFonts.add(fontName);
    }

    return result;
  }

  private async loadV4Font(fontName: string, paddedPage: string): Promise<boolean> {
    return new Promise((resolve) => {
      const fontUrl = `https://static.quranwbw.com/data/v4/fonts/Hafs/KFGQPC-v4/COLRv1/QCF4${paddedPage}_COLOR-Regular.woff2?version=13`;

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
          console.error(`Failed to load V4 font ${fontName}:`, error);
          resolve(false);
        });
    });
  }

  // Get font family for any page (all pages use the same UthmanicHafs_V22 font)
  getFontFamily(pageNumber: number): string {
    const fontName = 'UthmanicHafs_V22';

    if (this.loadedFonts.has(fontName)) {
      return `'${fontName}', 'Amiri', serif`;
    }

    return `'Amiri', serif`;
  }

  // Get V4 font family for a specific page
  getV4FontFamily(pageNumber: number): string {
    const paddedPage = String(pageNumber).padStart(3, '0');
    const fontName = `QCF4${paddedPage}`;

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

  // Preload multiple V4 page fonts
  async preloadV4PageFonts(pageNumbers: number[]): Promise<void> {
    const promises = pageNumbers.map(pageNum => this.loadV4PageFont(pageNum));
    await Promise.allSettled(promises);
  }

  // Check if the UthmanicHafs_V22 font is loaded
  isPageFontLoaded(pageNumber: number): boolean {
    const fontName = 'UthmanicHafs_V22';
    return this.loadedFonts.has(fontName);
  }

  // Check if the V4 font for a page is loaded
  isV4PageFontLoaded(pageNumber: number): boolean {
    const paddedPage = String(pageNumber).padStart(3, '0');
    const fontName = `QCF4${paddedPage}`;
    return this.loadedFonts.has(fontName);
  }
}

// Export singleton instance
export const qpcFontLoader = QPCFontLoader.getInstance();
