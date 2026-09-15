'use client';

import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { synchronizeData } from '@/lib/syncClient';

/** Quietly refresh on opening this device, returning to the tab, or reconnecting. */
export function DataMigration() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    const sync = () => { if (document.visibilityState === 'visible') void synchronizeData(true); };
    sync();
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', sync);
    const interval = window.setInterval(sync, 60000);
    return () => {
      window.removeEventListener('online', sync);
      document.removeEventListener('visibilitychange', sync);
      window.clearInterval(interval);
    };
  }, [user, loading]);
  return null;
}
