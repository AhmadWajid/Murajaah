'use client';

import * as local from './storage';
import { normalizeAuthUser } from './authUser';
import { applyChanges, bookmarkKey, diffSnapshots, emptySnapshot, stableJSON, SyncChange, SyncSnapshot } from './syncModel';

export const SYNC_EVENT = 'mquran-sync-status';
export const SYNC_DATA_EVENT = 'mquran-sync-data';
const OWNER = 'mquran-sync-owner';
const BOOKMARKS = 'mquran_bookmarks';
interface DeviceState {
  snapshot: SyncSnapshot;
  pending: SyncChange[];
  initialized: boolean;
  lastSyncedAt?: string;
  cloudUpdatedAt?: string;
  lastEditedAt?: string;
  clockOffset?: number;
  legacyBackup?: SyncSnapshot;
}
let userId: string | null | undefined;
let authGeneration = 0;
let authPromise: Promise<void> | undefined;
let running: Promise<void> | undefined;
let lastFetch = 0;
let fallbackLock: Promise<unknown> = Promise.resolve();
let status: 'idle' | 'syncing' | 'offline' = 'idle';
const keyFor = () => `mquran-sync-v2:${userId || 'guest'}`;

function readSnapshot(): SyncSnapshot {
  const result = emptySnapshot();
  local.getAllMemorizationItems().forEach(i => { result.items[i.id] = i; });
  Object.entries(local.getMistakes()).forEach(([key, value]) => {
    if (!value) return;
    const [surah, ayah] = key.split(':').map(Number);
    result.mistakes[key] = typeof value === 'object' ? value : { surah, ayah, timestamp: new Date().toISOString() };
  });
  const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS) || '[]');
  bookmarks.forEach((b: any) => { result.bookmarks[bookmarkKey(b)] = b; });
  return result;
}
function applySnapshot(snapshot: SyncSnapshot) {
  local.saveMemorizationData({ items: Object.values(snapshot.items) as any, lastSync: new Date().toISOString(), version: '1.0.0' });
  local.saveMistakes(snapshot.mistakes as any);
  localStorage.setItem(BOOKMARKS, JSON.stringify(Object.values(snapshot.bookmarks)));
}
function readState(): DeviceState {
  const raw = localStorage.getItem(keyFor());
  return raw ? JSON.parse(raw) : { snapshot: readSnapshot(), pending: [], initialized: false };
}
function saveState(state: DeviceState) { localStorage.setItem(keyFor(), JSON.stringify(state)); }
function notify() { window.dispatchEvent(new Event(SYNC_EVENT)); }

export function setSyncUser(id: string | null) {
  if (typeof window === 'undefined') return;
  const previous = localStorage.getItem(OWNER);
  authGeneration++;
  userId = id;
  const next = id || 'guest';
  if (previous !== next) {
    if (previous) {
      // Each account keeps its own durable cache and queue; never upload another account's data.
      const oldKey = `mquran-sync-v2:${previous}`;
      const old = localStorage.getItem(oldKey);
      if (!old) localStorage.setItem(oldKey, JSON.stringify({ snapshot: readSnapshot(), pending: [], initialized: false }));
      const saved = localStorage.getItem(keyFor());
      const guestSnapshot = previous === 'guest' ? readSnapshot() : emptySnapshot();
      if (previous === 'guest') {
        const guestState: DeviceState = JSON.parse(localStorage.getItem(oldKey) || '{}');
        const target: DeviceState = saved ? JSON.parse(saved) : { snapshot: guestSnapshot, pending: [], initialized: false };
        const seen = new Set(target.pending.map(change => change.id));
        const guestChanges = (guestState.pending || []).filter(change => !seen.has(change.id));
        target.pending.push(...guestChanges);
        target.snapshot = applyChanges(target.snapshot, target.pending).snapshot;
        if (guestState.lastEditedAt && (!target.lastEditedAt || guestState.lastEditedAt > target.lastEditedAt)) target.lastEditedAt = guestState.lastEditedAt;
        // Persist the account queue before consuming the guest queue. This also
        // recovers edits stranded as guest data by the old userId/id mismatch.
        saveState(target);
        localStorage.setItem(oldKey, JSON.stringify({ snapshot: emptySnapshot(), pending: [], initialized: false }));
        applySnapshot(target.snapshot);
      } else {
        applySnapshot(saved ? JSON.parse(saved).snapshot : emptySnapshot());
      }
    }
    localStorage.setItem(OWNER, next);
    lastFetch = 0;
  }
  const saved = localStorage.getItem(keyFor());
  if (saved) applySnapshot(JSON.parse(saved).snapshot);
}
async function identify() {
  if (userId !== undefined) return;
  if (!authPromise) authPromise = (async () => {
    const generation = authGeneration;
    try {
      const res = await fetch('/api/auth/me', { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('Auth unavailable');
      const data = await res.json();
      if (generation === authGeneration) setSyncUser(normalizeAuthUser(data.user)?.id || null);
    } catch {
      // Stay with this device's previously authenticated account while offline.
      if (generation !== authGeneration) return;
      const owner = localStorage.getItem(OWNER);
      setSyncUser(owner && owner !== 'guest' ? owner : null);
    }
  })().finally(() => { authPromise = undefined; });
  await authPromise;
}
async function locked<T>(fn: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request('mquran-data-sync', fn);
  const task = fallbackLock.then(fn);
  fallbackLock = task.catch(() => {});
  return task;
}
export function getSyncStatus() {
  if (typeof window === 'undefined') return { status: 'idle', pending: 0 };
  const state = readState();
  return { status, pending: state.pending.length, lastSyncedAt: state.lastSyncedAt, cloudUpdatedAt: state.cloudUpdatedAt, lastEditedAt: state.lastEditedAt, hasLegacyBackup: !!state.legacyBackup };
}

/** Save the exact edit (including deletions) before attempting any network request. */
export async function mutateSyncedData<T>(fn: () => T): Promise<T> {
  await identify();
  const result = await locked(async () => {
    if (localStorage.getItem(OWNER) !== (userId || 'guest')) throw new Error('Your account changed in another tab. Reload before editing.');
    const state = readState();
    // Recover a previously saved queue/cache after a reload or an interrupted request.
    if (localStorage.getItem(keyFor())) applySnapshot(state.snapshot);
    const before = readSnapshot();
    const value = fn();
    const after = readSnapshot();
    const changedAt = Math.max(Date.now() + (state.clockOffset || 0), (Date.parse(state.lastEditedAt || '') || 0) + 1, ...state.pending.map(c => c.changedAt + 1));
    const changes = diffSnapshots(before, after, changedAt, () => crypto.randomUUID());
    state.snapshot = after;
    state.pending.push(...changes);
    if (changes.length) state.lastEditedAt = new Date(changedAt).toISOString();
    saveState(state);
    notify();
    return value;
  });
  await synchronizeData(true);
  return result;
}

export async function synchronizeData(force = false): Promise<void> {
  if (typeof window === 'undefined') return;
  await identify();
  if (!userId) return;
  if (running) return running;
  if (!force && Date.now() - lastFetch < 3000) return;
  const account = userId;
  running = locked(async () => {
    if (account !== userId || localStorage.getItem(OWNER) !== account) return;
    status = 'syncing'; notify();
    try {
      let state = readState();
      const before = readSnapshot();
      // On first connection, inspect the cloud before deciding whether legacy local data is a new import.
      const send = async (changes: SyncChange[]) => {
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: account, changes }), signal: AbortSignal.timeout(15000) });
          if (res.status === 409) continue;
          if (!res.ok) throw new Error(`Sync failed (${res.status})`);
          return res.json();
        }
        throw new Error('Another device is updating. Retry shortly.');
      };
      if (!state.initialized) {
        const cloud = await send([]);
        if (account !== userId || localStorage.getItem(OWNER) !== account) return;
        const cloudEmpty = Object.values(cloud.snapshot as SyncSnapshot).every(records => Object.keys(records).length === 0);
        if (cloudEmpty) {
          // Retain explicit queued deletions and use older import timestamps so fresh edits win.
          const imports = diffSnapshots(emptySnapshot(), state.snapshot, 0, () => crypto.randomUUID());
          state.pending = [...imports, ...state.pending];
        } else if (stableJSON(state.snapshot) !== stableJSON(cloud.snapshot)) {
          // Legacy data has no reliable edit timestamps. Preserve a backup, use cloud
          // for untracked data, and still send all explicitly tracked device edits.
          state.legacyBackup = state.snapshot;
        }
        state.initialized = true;
        state.clockOffset = cloud.serverTime - Date.now();
        saveState(state);
      }
      const data = await send(state.pending);
      if (account !== userId || localStorage.getItem(OWNER) !== account) return;
      state = { ...state, snapshot: data.snapshot, pending: [], lastSyncedAt: new Date().toISOString(), cloudUpdatedAt: data.updatedAt, clockOffset: data.serverTime - Date.now() };
      saveState(state);
      applySnapshot(state.snapshot);
      lastFetch = Date.now();
      status = 'idle';
      if (stableJSON(before) !== stableJSON(state.snapshot)) window.dispatchEvent(new Event(SYNC_DATA_EVENT));
    } catch (error) {
      status = 'offline';
      console.warn('[sync] Device changes are saved; retry on reconnect.', error);
    } finally { notify(); }
  }).finally(() => { running = undefined; });
  return running;
}

export async function readSyncedData<T>(fn: () => T): Promise<T> {
  await synchronizeData();
  return fn();
}
export function downloadLegacyBackup() {
  const backup = readState().legacyBackup;
  if (!backup) return;
  const blob = new Blob([JSON.stringify({ items: Object.values(backup.items), mistakes: backup.mistakes, bookmarks: Object.values(backup.bookmarks) }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'murajaah-device-backup.json'; link.click();
  URL.revokeObjectURL(url);
}
