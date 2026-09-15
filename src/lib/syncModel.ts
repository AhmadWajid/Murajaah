/** Per-record changes: an untouched device never overwrites newer cloud data. */
export type SyncCollection = 'items' | 'mistakes' | 'bookmarks';
export type SyncRecord = Record<string, any>;
export interface SyncSnapshot {
  items: Record<string, SyncRecord>;
  mistakes: Record<string, SyncRecord>;
  bookmarks: Record<string, SyncRecord>;
}
export interface SyncChange {
  id: string;
  collection: SyncCollection;
  key: string;
  value: SyncRecord | null;
  changedAt: number;
}
export interface SyncVersion { changedAt: number; id: string }
export const emptySnapshot = (): SyncSnapshot => ({ items: {}, mistakes: {}, bookmarks: {} });
export const bookmarkKey = (b: SyncRecord) => `${b.type}:${b.page ?? ''}:${b.surah ?? ''}:${b.ayah ?? ''}`;
export function stableJSON(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${stableJSON(value[k])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export function diffSnapshots(before: SyncSnapshot, after: SyncSnapshot, changedAt: number, id: () => string): SyncChange[] {
  const changes: SyncChange[] = [];
  for (const collection of ['items', 'mistakes', 'bookmarks'] as const) {
    for (const key of new Set([...Object.keys(before[collection]), ...Object.keys(after[collection])])) {
      if (stableJSON(before[collection][key]) !== stableJSON(after[collection][key])) {
        changes.push({ id: id(), collection, key, value: after[collection][key] ?? null, changedAt });
      }
    }
  }
  return changes;
}
export function applyChanges(snapshot: SyncSnapshot, changes: SyncChange[], versions: Record<string, SyncVersion> = {}) {
  const result = structuredClone(snapshot);
  const nextVersions = { ...versions };
  const accepted: SyncChange[] = [];
  for (const change of changes) {
    const key = `${change.collection}/${change.key}`;
    const previous = nextVersions[key];
    if (previous?.id === change.id) continue;
    if (previous && (previous.changedAt > change.changedAt || (previous.changedAt === change.changedAt && previous.id >= change.id))) continue;
    if (change.value === null) delete result[change.collection][change.key];
    else result[change.collection][change.key] = change.value;
    nextVersions[key] = { changedAt: change.changedAt, id: change.id };
    accepted.push(change);
  }
  return { snapshot: result, versions: nextVersions, accepted };
}
