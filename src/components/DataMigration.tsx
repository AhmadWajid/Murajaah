'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { compareLocalAndDb } from '@/lib/storageService';
import { SyncModal } from './SyncModal';

/**
 * DataMigration — auto-prompts the SyncModal when a user logs in
 * and there's a mismatch between localStorage and the database.
 *
 * The sync button in the header is always available for manual sync.
 * This component just handles the auto-prompt on login.
 */
export function DataMigration() {
  const { user, loading } = useAuth();
  const [autoPromptOpen, setAutoPromptOpen] = useState(false);
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only check once per login session, and only after auth is loaded
    if (loading || !user) {
      checkedRef.current = null;
      return;
    }

    // Don't re-check for the same user
    if (checkedRef.current === user.id) return;
    checkedRef.current = user.id;

    const checkMismatch = async () => {
      try {
        const comparison = await compareLocalAndDb();
        if (comparison.hasMismatch) {
          setAutoPromptOpen(true);
        }
      } catch (e) {
        // Silently fail — user can manually trigger sync from header
        console.warn('Auto sync check failed:', e);
      }
    };

    checkMismatch();
  }, [user, loading]);

  return (
    <SyncModal
      open={autoPromptOpen}
      onOpenChange={setAutoPromptOpen}
    />
  );
}
