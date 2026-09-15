import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/neon/client';
import { memorizationItems, mistakes, bookmarks, storageMetadata } from '@/lib/neon/schema';
import { dbToItem, itemToDb } from '@/lib/neon/converters';
import { getSessionFromCookie, generateId } from '@/lib/auth';
import { applyChanges, bookmarkKey, emptySnapshot, SyncChange, SyncVersion } from '@/lib/syncModel';
import { MemorizationItem } from '@/lib/spacedRepetition';

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  const userId = session.userId;
  try {
    const body = await request.json();
    if (body.userId !== userId) return NextResponse.json({ error: 'Account changed. Reload before syncing.' }, { status: 403 });
    if (!Array.isArray(body.changes) || body.changes.length > 5000) return NextResponse.json({ error: 'Invalid changes' }, { status: 400 });
    const now = Date.now();
    const changes: SyncChange[] = body.changes;
    for (const c of changes) {
      if (!c || !['items', 'mistakes', 'bookmarks'].includes(c.collection) || typeof c.key !== 'string' || !c.key || ['__proto__', 'constructor', 'prototype'].includes(c.key) || c.key.length > 200 || typeof c.id !== 'string' || !Number.isFinite(c.changedAt) || c.changedAt < 0 || (c.value !== null && (typeof c.value !== 'object' || Array.isArray(c.value)))) {
        return NextResponse.json({ error: 'Invalid change' }, { status: 400 });
      }
      // A device clock in the future must not permanently defeat other devices.
      c.changedAt = Math.min(c.changedAt, now);
      if (c.value !== null) {
        const v = c.value;
        const valid = c.collection === 'items'
          ? v.id === c.key && Number.isInteger(v.surah) && v.surah >= 1 && v.surah <= 114 && Number.isInteger(v.ayahStart) && Number.isInteger(v.ayahEnd) && v.ayahStart > 0 && v.ayahEnd >= v.ayahStart && Number.isFinite(v.interval) && typeof v.nextReview === 'string' && typeof v.createdAt === 'string'
          : c.collection === 'mistakes'
            ? c.key === `${v.surah}:${v.ayah}` && Number.isInteger(v.surah) && Number.isInteger(v.ayah) && typeof v.timestamp === 'string'
            : c.key === bookmarkKey(v) && ['page', 'ayah'].includes(v.type) && typeof v.id === 'string' && v.id.length <= 36;
        if (!valid) return NextResponse.json({ error: 'Invalid record' }, { status: 400 });
      }
    }
    await db.insert(storageMetadata).values({ userId, version: '1', lastSync: null }).onConflictDoNothing();
    // Read the revision first. The transaction below rejects any intervening writer.
    const [metadata] = await db.select().from(storageMetadata).where(eq(storageMetadata.userId, userId));
    const revision = metadata.version || '1';
    let versions: Record<string, SyncVersion> = {};
    try { versions = JSON.parse(revision).records || {}; } catch { /* Legacy metadata. */ }
    const [itemRows, mistakeRows, bookmarkRows] = await Promise.all([
      db.select().from(memorizationItems).where(eq(memorizationItems.userId, userId)),
      db.select().from(mistakes).where(eq(mistakes.userId, userId)),
      db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
    ]);
    const snapshot = emptySnapshot();
    itemRows.forEach(r => { snapshot.items[dbToItem(r).id] = dbToItem(r); });
    mistakeRows.forEach(r => { snapshot.mistakes[`${r.surah}:${r.ayah}`] = { surah: r.surah, ayah: r.ayah, timestamp: r.timestamp }; });
    bookmarkRows.forEach(r => {
      const value = { id: r.id, type: r.type, page: r.page, surah: r.surah, ayah: r.ayah, label: r.label, surahName: r.surahName || r.label, createdAt: r.createdAt.toISOString() };
      snapshot.bookmarks[bookmarkKey(value)] = value;
    });
    const merged = applyChanges(snapshot, changes, versions);
    // Neon HTTP batches execute atomically. Lock + revision guard prevent two
    // devices from committing snapshots computed from the same old revision.
    const operations: any[] = [
      db.execute(sql`select user_id from storage_metadata where user_id = ${userId} for update`),
      db.execute(sql`select 1 / case when version = ${revision} then 1 else 0 end from storage_metadata where user_id = ${userId}`),
    ];
    for (const c of merged.accepted) {
      if (c.collection === 'items') {
        const databaseId = itemRows.find(row => dbToItem(row).id === c.key)?.id || `${userId}/${c.key}`;
        if (c.value === null) operations.push(db.delete(memorizationItems).where(and(eq(memorizationItems.userId, userId), eq(memorizationItems.id, databaseId))));
        else {
          const value = { ...itemToDb(c.value as MemorizationItem, userId), id: databaseId };
          operations.push(db.insert(memorizationItems).values(value).onConflictDoUpdate({ target: memorizationItems.id, set: value, setWhere: eq(memorizationItems.userId, userId) }));
        }
      } else if (c.collection === 'mistakes') {
        const [surah, ayah] = c.key.split(':').map(Number);
        operations.push(db.delete(mistakes).where(and(eq(mistakes.userId, userId), eq(mistakes.surah, surah), eq(mistakes.ayah, ayah))));
        if (c.value) operations.push(db.insert(mistakes).values({ id: generateId(), userId, surah, ayah, timestamp: c.value.timestamp }));
      } else {
        const [type, page, surah, ayah] = c.key.split(':');
        operations.push(db.delete(bookmarks).where(and(
          eq(bookmarks.userId, userId), eq(bookmarks.type, type),
          page ? eq(bookmarks.page, Number(page)) : isNull(bookmarks.page),
          surah ? eq(bookmarks.surah, Number(surah)) : isNull(bookmarks.surah),
          ayah ? eq(bookmarks.ayah, Number(ayah)) : isNull(bookmarks.ayah),
        )));
        if (c.value) {
          const b = c.value;
          operations.push(db.insert(bookmarks).values({ id: b.id, userId, type: b.type, page: b.page ?? null, surah: b.surah ?? null, ayah: b.ayah ?? null, label: b.label ?? null, surahName: b.surahName ?? null, createdAt: b.createdAt ? new Date(b.createdAt) : new Date(now) }).onConflictDoUpdate({ target: bookmarks.id, set: { label: b.label ?? null, surahName: b.surahName ?? null }, setWhere: eq(bookmarks.userId, userId) }));
        }
      }
    }
    const updatedAt = merged.accepted.length ? new Date(now) : metadata.lastSync;
    if (merged.accepted.length) operations.push(db.update(storageMetadata).set({ version: JSON.stringify({ revision: generateId(), records: merged.versions }), lastSync: updatedAt }).where(eq(storageMetadata.userId, userId)));
    await db.batch(operations as [any, ...any[]]);
    return NextResponse.json({ snapshot: merged.snapshot, updatedAt, serverTime: now });
  } catch (error: any) {
    // PostgreSQL division-by-zero is our optimistic revision guard.
    if (error?.code === '22012' || error?.cause?.code === '22012') return NextResponse.json({ error: 'Sync changed; retry' }, { status: 409 });
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed. Your device changes are retained.' }, { status: 500 });
  }
}
