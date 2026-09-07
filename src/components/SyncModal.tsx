'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  compareLocalAndDb,
  syncUploadLocalToDb,
  syncDownloadDbToLocal,
  syncMerge,
  type SyncComparison,
} from '@/lib/storageService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Download, Merge, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface SyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

export function SyncModal({ open, onOpenChange, onSyncComplete }: SyncModalProps) {
  const { user } = useAuth();
  const [comparison, setComparison] = useState<SyncComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | null>(null);
  const [error, setError] = useState('');

  const loadComparison = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const result = await compareLocalAndDb();
      setComparison(result);
    } catch (e: any) {
      setError(e.message || 'Failed to compare data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      setSyncResult(null);
      loadComparison();
    }
  }, [open, user, loadComparison]);

  const handleUploadLocal = async () => {
    setSyncing(true);
    setError('');
    try {
      await syncUploadLocalToDb();
      setSyncResult('success');
      onSyncComplete?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to upload local data');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadDb = async () => {
    setSyncing(true);
    setError('');
    try {
      await syncDownloadDbToLocal();
      setSyncResult('success');
      onSyncComplete?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to download database data');
    } finally {
      setSyncing(false);
    }
  };

  const handleMerge = async () => {
    setSyncing(true);
    setError('');
    try {
      await syncMerge();
      setSyncResult('success');
      onSyncComplete?.();
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to merge data');
    } finally {
      setSyncing(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-accent" />
            Sync Data
          </DialogTitle>
          <DialogDescription>
            Keep your local device and cloud data in sync.
          </DialogDescription>
        </DialogHeader>

        {syncResult === 'success' ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <p className="font-semibold text-foreground">Sync complete!</p>
            <p className="text-sm text-muted-foreground">Your data is now in sync.</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Comparing data...</p>
          </div>
        ) : comparison ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">This device</p>
                <p className="text-lg font-bold text-foreground">{comparison.localItems}</p>
                <p className="text-xs text-muted-foreground">passages</p>
                <p className="text-sm font-semibold text-accent mt-1">{comparison.localMistakes} mistakes</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1">Cloud</p>
                <p className="text-lg font-bold text-foreground">{comparison.dbItems}</p>
                <p className="text-xs text-muted-foreground">passages</p>
                <p className="text-sm font-semibold text-accent mt-1">{comparison.dbMistakes} mistakes</p>
              </div>
            </div>

            {/* Mismatch details */}
            {comparison.hasMismatch ? (
              <div className="rounded-[var(--radius-md)] bg-warning/10 border border-warning/30 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-sm font-semibold text-warning">Data mismatch detected</p>
                </div>
                {(comparison.localOnlyItems > 0 || comparison.dbOnlyItems > 0 || comparison.differentItems > 0) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 pl-6">
                    {comparison.localOnlyItems > 0 && <p>{comparison.localOnlyItems} passages only on this device</p>}
                    {comparison.dbOnlyItems > 0 && <p>{comparison.dbOnlyItems} passages only in cloud</p>}
                    {comparison.differentItems > 0 && <p>{comparison.differentItems} passages differ between the two</p>}
                  </div>
                )}
                {comparison.localMistakes !== comparison.dbMistakes && (
                  <p className="text-xs text-muted-foreground pl-6">Mistake counts differ</p>
                )}
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] bg-success/10 border border-success/30 p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <p className="text-sm font-semibold text-success">Everything is in sync</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {comparison.hasMismatch && (
                <Button
                  onClick={handleMerge}
                  disabled={syncing}
                  className="w-full"
                >
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
                  Merge both (recommended)
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleUploadLocal}
                  disabled={syncing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload local
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadDb}
                  disabled={syncing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download cloud
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                {comparison.hasMismatch
                  ? 'Upload replaces cloud with this device. Download replaces this device with cloud. Merge keeps the newest version of each passage.'
                  : 'No action needed — your data matches.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {error || 'Unable to load sync data.'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
