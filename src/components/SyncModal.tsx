'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { downloadLegacyBackup, getSyncStatus, synchronizeData, SYNC_EVENT } from '@/lib/syncClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, CloudOff, Loader2, RefreshCw } from 'lucide-react';

export function SyncModal({ open, onOpenChange, onSyncComplete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<ReturnType<typeof getSyncStatus>>({ status: 'idle', pending: 0 });
  useEffect(() => {
    const update = () => setState(getSyncStatus());
    update();
    window.addEventListener(SYNC_EVENT, update);
    return () => window.removeEventListener(SYNC_EVENT, update);
  }, [open]);
  if (!user) return null;
  const syncing = state.status === 'syncing';
  const waiting = state.pending > 0 || state.status === 'offline';
  const format = (value?: string) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Device sync</DialogTitle>
          <DialogDescription>Your passages, mistakes, and bookmarks sync automatically when you open the app or reconnect.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-muted p-4">
          {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : waiting ? <CloudOff className="w-5 h-5 text-warning" /> : <CheckCircle className="w-5 h-5 text-success" />}
          <div>
            <p className="font-semibold text-sm">{syncing ? 'Syncing…' : waiting ? 'Saved on this device' : state.lastSyncedAt ? 'Up to date' : 'Ready to sync'}</p>
            <p className="text-xs text-muted-foreground mt-1">{waiting ? `${state.pending} ${state.pending === 1 ? 'change' : 'changes'} waiting to sync. We’ll retry automatically.` : 'The newest change to each item is kept across devices.'}</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div><dt className="text-muted-foreground text-xs">Last synced on this device</dt><dd>{format(state.lastSyncedAt)}</dd></div>
          <div><dt className="text-muted-foreground text-xs">Latest cloud update</dt><dd>{format(state.cloudUpdatedAt)}</dd></div>
          <div><dt className="text-muted-foreground text-xs">Last change on this device</dt><dd>{format(state.lastEditedAt)}</dd></div>
        </dl>
        {state.hasLegacyBackup && <div className="text-xs text-muted-foreground space-y-2">
          <p>An older device copy had no reliable edit dates. The cloud copy was used and the old device data was backed up.</p>
          <Button variant="outline" size="sm" onClick={downloadLegacyBackup}>Download older device backup</Button>
        </div>}
        <Button disabled={syncing} onClick={async () => { await synchronizeData(true); if (getSyncStatus().status === 'idle') onSyncComplete?.(); }}>
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync now'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
