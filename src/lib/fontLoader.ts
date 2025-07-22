// Font loading utility for QPC V2 font
export class FontLoader {
  private static instance: FontLoader;
  private fontLoaded = false;
  private fontLoadPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): FontLoader {
    if (!FontLoader.instance) {
      FontLoader.instance = new FontLoader();
    }
    return FontLoader.instance;
  }

  async loadQPCFont(): Promise<boolean> {
    if (this.fontLoaded) {
      return true;
    }

    if (this.fontLoadPromise) {
      return this.fontLoadPromise;
    }

    this.fontLoadPromise = new Promise((resolve) => {
      // Check if the font is already loaded
      if (document.fonts && document.fonts.check) {
        if (document.fonts.check('1em qpc-v2')) {
          this.fontLoaded = true;
          resolve(true);
          return;
        }
      }

      // Create a test element to check font loading
      const testElement = document.createElement('div');
      testElement.style.fontFamily = 'qpc-v2, monospace';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.style.fontSize = '72px';
      testElement.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
      document.body.appendChild(testElement);

      // Check if font loaded by comparing metrics
      const originalWidth = testElement.offsetWidth;
      
      const checkFont = () => {
        const newWidth = testElement.offsetWidth;
        if (newWidth !== originalWidth) {
          this.fontLoaded = true;
          document.body.removeChild(testElement);
          resolve(true);
        } else {
          setTimeout(checkFont, 100);
        }
      };

      // Start checking after a short delay
      setTimeout(checkFont, 100);

      // Fallback timeout
      setTimeout(() => {
        if (!this.fontLoaded) {
          document.body.removeChild(testElement);
          console.warn('QPC V2 font failed to load, using fallback');
          resolve(false);
        }
      }, 5000);
    });

    return this.fontLoadPromise;
  }

  isFontLoaded(): boolean {
    return this.fontLoaded;
  }

  // Get appropriate font family based on loading state
  getFontFamily(): string {
    if (this.fontLoaded) {
      return "'qpc-v2', 'qpc-v2-fallback', 'Amiri', serif";
    }
    return "'Amiri', serif";
  }
}

// Export singleton instance
export const fontLoader = FontLoader.getInstance(); 