import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640;

/**
 * Single source of truth for mobile detection.
 * Uses matchMedia for efficiency (no resize listener spam).
 * Returns false during SSR, resolves on mount.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isMobile;
}
