/**
 * Unified data API route for all database operations.
 * Replaces the Supabase client-side SDK calls with server-side Drizzle queries.
 *
 * Operations:
 *  GET    /api/data?type=items              — get all memorization items
 *  GET    /api/data?type=items&id=xxx       — get single item
 *  GET    /api/data?type=mistakes           — get all mistakes
 *  GET    /api/data?type=mistakesList       — get mistakes as array
 *  GET    /api/data?type=settings           — get user settings
 *  GET    /api/data?type=dailyReviews&days=30 — get daily review data
 *
 *  POST   /api/data  { op: 'addItem', item }
 *  POST   /api/data  { op: 'updateItem', item }
 *  POST   /api/data  { op: 'removeItem', id }
 *  POST   /api/data  { op: 'toggleMistake', surah, ayah }
 *  POST   /api/data  { op: 'removeMistake', surah, ayah }
 *  POST   /api/data  { op: 'clearAllMistakes' }
 *  POST   /api/data  { op: 'clearAllItems' }
 *  POST   /api/data  { op: 'saveSettings', settings }
 *  POST   /api/data  { op: 'saveMistakes', mistakes }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/neon/client';
import { memorizationItems, mistakes, userSettings, storageMetadata, bookmarks } from '@/lib/neon/schema';
import { getSessionFromCookie, generateId } from '@/lib/auth';
import { eq, and, asc, desc } from 'drizzle-orm';
import { MemorizationItem } from '@/lib/spacedRepetition';
import { getTodayISODate } from '@/lib/utils';

// ─── Converters ───
function dbToItem(row: typeof memorizationItems.$inferSelect): MemorizationItem {
  return {
    id: row.id,
    surah: row.surah,
    ayahStart: row.ayahStart,
    ayahEnd: row.ayahEnd,
    interval: row.intervalDays,
    nextReview: row.nextReview,
    easeFactor: row.easeFactor,
    reviewCount: row.reviewCount,
    lastReviewed: row.lastReviewed || undefined,
    completedToday: row.completedToday || undefined,
    createdAt: row.createdAt,
    memorizationAge: row.memorizationAge ?? undefined,
    individualRatings: row.individualRatings as any || undefined,
    individualRecallQuality: row.individualRecallQuality as any || undefined,
    rukuStart: row.rukuStart || undefined,
    rukuEnd: row.rukuEnd || undefined,
    rukuCount: row.rukuCount || undefined,
    difficultyLevel: row.difficultyLevel as any || undefined,
    name: row.name || undefined,
    description: row.description || undefined,
    tags: row.tags as any || undefined,
    isBeginner: row.isBeginner || undefined,
    beginnerStartedAtReview: row.beginnerStartedAtReview ?? undefined,
    stability: row.stability || undefined,
    difficulty: row.difficulty || undefined,
  };
}

function itemToDb(item: MemorizationItem, userId: string) {
  return {
    id: item.id,
    userId,
    surah: item.surah,
    ayahStart: item.ayahStart,
    ayahEnd: item.ayahEnd,
    intervalDays: item.interval,
    nextReview: item.nextReview,
    easeFactor: item.easeFactor,
    reviewCount: item.reviewCount,
    lastReviewed: item.lastReviewed || null,
    completedToday: item.completedToday || null,
    createdAt: item.createdAt,
    memorizationAge: item.memorizationAge ?? null,
    individualRatings: item.individualRatings || {},
    individualRecallQuality: item.individualRecallQuality || {},
    rukuStart: item.rukuStart || null,
    rukuEnd: item.rukuEnd || null,
    rukuCount: item.rukuCount || null,
    difficultyLevel: item.difficultyLevel || null,
    name: item.name || null,
    description: item.description || null,
    tags: item.tags || [],
    isBeginner: item.isBeginner ?? null,
    beginnerStartedAtReview: item.beginnerStartedAtReview ?? null,
    stability: item.stability ?? null,
    difficulty: item.difficulty ?? null,
  };
}

// ─── Auth guard ───
async function requireAuth() {
  const session = await getSessionFromCookie();
  if (!session) return null;
  return session;
}

// ─── GET ───
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const days = parseInt(searchParams.get('days') || '30');

    if (type === 'items') {
      if (id) {
        const rows = await db.select().from(memorizationItems)
          .where(and(eq(memorizationItems.id, id), eq(memorizationItems.userId, session.userId)))
          .limit(1);
        if (rows.length === 0) return NextResponse.json({ item: null });
        return NextResponse.json({ item: dbToItem(rows[0]) });
      }
      const rows = await db.select().from(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId))
        .orderBy(asc(memorizationItems.createdAt));
      return NextResponse.json({ items: rows.map(dbToItem) });
    }

    if (type === 'mistakes') {
      const rows = await db.select().from(mistakes)
        .where(eq(mistakes.userId, session.userId));
      const record: Record<string, any> = {};
      rows.forEach(r => {
        record[`${r.surah}:${r.ayah}`] = { timestamp: r.timestamp, surah: r.surah, ayah: r.ayah };
      });
      return NextResponse.json({ mistakes: record });
    }

    if (type === 'mistakesList') {
      const rows = await db.select().from(mistakes)
        .where(eq(mistakes.userId, session.userId))
        .orderBy(desc(mistakes.timestamp));
      return NextResponse.json({ mistakes: rows.map(r => ({ timestamp: r.timestamp, surah: r.surah, ayah: r.ayah })) });
    }

    if (type === 'mistakesVerseOrder') {
      const rows = await db.select().from(mistakes)
        .where(eq(mistakes.userId, session.userId))
        .orderBy(asc(mistakes.surah), asc(mistakes.ayah));
      return NextResponse.json({ mistakes: rows.map(r => ({ timestamp: r.timestamp, surah: r.surah, ayah: r.ayah })) });
    }

    if (type === 'settings') {
      const rows = await db.select().from(userSettings)
        .where(eq(userSettings.userId, session.userId))
        .limit(1);
      if (rows.length === 0) {
        return NextResponse.json({ settings: null });
      }
      const s = rows[0];
      return NextResponse.json({
        settings: {
          selectedReciter: s.selectedReciter,
          hideMistakes: s.hideMistakes,
          lastPage: s.lastPage,
          arabicFontSize: s.arabicFontSize,
          translationFontSize: s.translationFontSize,
          fontTargetArabic: s.fontTargetArabic,
          fontSize: s.fontSize,
          padding: s.padding,
          layoutMode: s.layoutMode,
          selectedLanguage: s.selectedLanguage,
          selectedTranslation: s.selectedTranslation,
          enableTajweed: s.enableTajweed,
          audioLoopMode: s.audioLoopMode,
          audioCustomLoop: s.audioCustomLoop,
          audioPlaybackSpeed: s.audioPlaybackSpeed,
          showWordByWordTooltip: s.showWordByWordTooltip,
          mobileHeaderHidden: s.mobileHeaderHidden,
          userTimezone: s.userTimezone,
          favoriteReciters: s.favoriteReciters,
          reviewSettings: s.reviewSettings,
          readingLayout: s.readingLayout,
          hideWords: s.hideWords,
          hideWordsDelay: s.hideWordsDelay,
        },
      });
    }

    if (type === 'dailyReviews') {
      const rows = await db.select().from(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId));
      const today = new Date();
      const dailyData: Record<string, { date: string; reviews: number; newItems: number; completedItems: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        dailyData[ds] = { date: ds, reviews: 0, newItems: 0, completedItems: 0 };
      }
      rows.forEach(item => {
        if (item.lastReviewed) {
          const rd = item.lastReviewed.split('T')[0];
          if (dailyData[rd]) dailyData[rd].reviews += 1;
        }
        if (item.completedToday) {
          if (dailyData[item.completedToday]) dailyData[item.completedToday].completedItems += 1;
        }
        if (item.createdAt) {
          const cd = item.createdAt.split('T')[0];
          if (dailyData[cd]) dailyData[cd].newItems += 1;
        }
      });
      return NextResponse.json({ dailyReviews: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)) });
    }

    if (type === 'bookmarks') {
      const rows = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, session.userId))
        .orderBy(desc(bookmarks.createdAt));
      return NextResponse.json({ bookmarks: rows });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('Data GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST ───
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const body = await request.json();
    const { op } = body;

    // ─── Memorization Items ───
    if (op === 'addItem') {
      await db.insert(memorizationItems)
        .values(itemToDb(body.item, session.userId))
        .onConflictDoUpdate({ target: memorizationItems.id, set: itemToDb(body.item, session.userId) });
      return NextResponse.json({ success: true });
    }

    if (op === 'updateItem') {
      await db.update(memorizationItems)
        .set(itemToDb(body.item, session.userId))
        .where(and(eq(memorizationItems.id, body.item.id), eq(memorizationItems.userId, session.userId)));
      return NextResponse.json({ success: true });
    }

    if (op === 'removeItem') {
      await db.delete(memorizationItems)
        .where(and(eq(memorizationItems.id, body.id), eq(memorizationItems.userId, session.userId)));
      return NextResponse.json({ success: true });
    }

    if (op === 'clearAllItems') {
      await db.delete(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId));
      return NextResponse.json({ success: true });
    }

    // ─── Mistakes ───
    if (op === 'toggleMistake') {
      const { surah, ayah } = body;
      const existing = await db.select().from(mistakes)
        .where(and(eq(mistakes.userId, session.userId), eq(mistakes.surah, surah), eq(mistakes.ayah, ayah)))
        .limit(1);
      if (existing.length > 0) {
        await db.delete(mistakes)
          .where(and(eq(mistakes.userId, session.userId), eq(mistakes.surah, surah), eq(mistakes.ayah, ayah)));
      } else {
        await db.insert(mistakes).values({
          id: generateId(),
          userId: session.userId,
          surah,
          ayah,
          timestamp: new Date().toISOString(),
        });
      }
      // Return all mistakes
      const rows = await db.select().from(mistakes).where(eq(mistakes.userId, session.userId));
      const record: Record<string, any> = {};
      rows.forEach(r => {
        record[`${r.surah}:${r.ayah}`] = { timestamp: r.timestamp, surah: r.surah, ayah: r.ayah };
      });
      return NextResponse.json({ mistakes: record });
    }

    if (op === 'removeMistake') {
      const { surah, ayah } = body;
      await db.delete(mistakes)
        .where(and(eq(mistakes.userId, session.userId), eq(mistakes.surah, surah), eq(mistakes.ayah, ayah)));
      const rows = await db.select().from(mistakes).where(eq(mistakes.userId, session.userId));
      const record: Record<string, any> = {};
      rows.forEach(r => {
        record[`${r.surah}:${r.ayah}`] = { timestamp: r.timestamp, surah: r.surah, ayah: r.ayah };
      });
      return NextResponse.json({ mistakes: record });
    }

    if (op === 'clearAllMistakes') {
      await db.delete(mistakes).where(eq(mistakes.userId, session.userId));
      return NextResponse.json({ success: true });
    }

    if (op === 'saveMistakes') {
      // Replace all mistakes
      await db.delete(mistakes).where(eq(mistakes.userId, session.userId));
      const entries = Object.entries(body.mistakes as Record<string, any>);
      if (entries.length > 0) {
        await db.insert(mistakes).values(
          entries.map(([key, m]) => ({
            id: generateId(),
            userId: session.userId,
            surah: m.surah,
            ayah: m.ayah,
            timestamp: m.timestamp,
          }))
        );
      }
      return NextResponse.json({ success: true });
    }

    // ─── Settings ───
    if (op === 'saveSettings') {
      const s = body.settings;
      // Upsert settings
      const existing = await db.select().from(userSettings)
        .where(eq(userSettings.userId, session.userId))
        .limit(1);

      const settingsData = {
        userId: session.userId,
        selectedReciter: s.selectedReciter,
        hideMistakes: s.hideMistakes,
        lastPage: s.lastPage,
        arabicFontSize: s.arabicFontSize,
        translationFontSize: s.translationFontSize,
        fontTargetArabic: s.fontTargetArabic,
        fontSize: s.fontSize,
        padding: s.padding,
        layoutMode: s.layoutMode,
        selectedLanguage: s.selectedLanguage,
        selectedTranslation: s.selectedTranslation,
        enableTajweed: s.enableTajweed,
        audioLoopMode: s.audioLoopMode,
        audioCustomLoop: s.audioCustomLoop,
        audioPlaybackSpeed: s.audioPlaybackSpeed,
        showWordByWordTooltip: s.showWordByWordTooltip,
        mobileHeaderHidden: s.mobileHeaderHidden,
        userTimezone: s.userTimezone,
        favoriteReciters: s.favoriteReciters,
        reviewSettings: s.reviewSettings,
        readingLayout: s.readingLayout,
        hideWords: s.hideWords,
        hideWordsDelay: s.hideWordsDelay,
      };

      if (existing.length > 0) {
        await db.update(userSettings).set(settingsData).where(eq(userSettings.userId, session.userId));
      } else {
        await db.insert(userSettings).values(settingsData);
      }
      return NextResponse.json({ success: true });
    }

    // ─── Migration (legacy — uploads local data to DB, merging) ───
    if (op === 'migrate') {
      const { items, mistakes: localMistakes } = body;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await db.insert(memorizationItems)
            .values(itemToDb(item, session.userId))
            .onConflictDoUpdate({ target: memorizationItems.id, set: itemToDb(item, session.userId) });
        }
      }
      if (localMistakes) {
        const entries = Object.entries(localMistakes as Record<string, any>);
        for (const [key, m] of entries) {
          if (typeof m === 'object' && m !== null) {
            await db.insert(mistakes).values({
              id: generateId(),
              userId: session.userId,
              surah: m.surah,
              ayah: m.ayah,
              timestamp: m.timestamp,
            }).onConflictDoNothing();
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // ─── Sync: upload local data to DB (overwrite DB with local) ───
    if (op === 'syncUploadLocal') {
      const { items, mistakes: localMistakes, bookmarks: localBookmarks } = body;
      // Clear all DB data for this user, then insert local data
      await db.delete(memorizationItems).where(eq(memorizationItems.userId, session.userId));
      await db.delete(mistakes).where(eq(mistakes.userId, session.userId));
      await db.delete(bookmarks).where(eq(bookmarks.userId, session.userId));

      if (items && Array.isArray(items)) {
        for (const item of items) {
          await db.insert(memorizationItems).values(itemToDb(item, session.userId));
        }
      }
      if (localMistakes) {
        const entries = Object.entries(localMistakes as Record<string, any>);
        for (const [, m] of entries) {
          if (typeof m === 'object' && m !== null) {
            await db.insert(mistakes).values({
              id: generateId(),
              userId: session.userId,
              surah: m.surah,
              ayah: m.ayah,
              timestamp: m.timestamp,
            });
          }
        }
      }
      if (localBookmarks && Array.isArray(localBookmarks)) {
        for (const bm of localBookmarks) {
          await db.insert(bookmarks).values({
            id: bm.id || generateId(),
            userId: session.userId,
            type: bm.type,
            page: bm.page ?? null,
            surah: bm.surah ?? null,
            ayah: bm.ayah ?? null,
            label: bm.surahName || bm.label || null,
            createdAt: bm.createdAt || new Date().toISOString(),
          }).onConflictDoNothing();
        }
      }
      return NextResponse.json({ success: true });
    }

    // ─── Sync: download DB data (return everything for local overwrite) ───
    if (op === 'syncDownloadDb') {
      const itemRows = await db.select().from(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId))
        .orderBy(asc(memorizationItems.createdAt));
      const mistakeRows = await db.select().from(mistakes)
        .where(eq(mistakes.userId, session.userId));
      const bookmarkRows = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, session.userId))
        .orderBy(desc(bookmarks.createdAt));

      const mistakesRecord: Record<string, any> = {};
      mistakeRows.forEach(r => {
        mistakesRecord[`${r.surah}:${r.ayah}`] = { timestamp: r.timestamp, surah: r.surah, ayah: r.ayah };
      });

      return NextResponse.json({
        items: itemRows.map(dbToItem),
        mistakes: mistakesRecord,
        bookmarks: bookmarkRows.map(r => ({
          id: r.id,
          type: r.type,
          page: r.page,
          surah: r.surah,
          ayah: r.ayah,
          surahName: r.label,
          createdAt: r.createdAt,
        })),
      });
    }

    // ─── Sync: merge local into DB (keep newest version of each item) ───
    if (op === 'syncMerge') {
      const { items: localItems, mistakes: localMistakes, bookmarks: localBookmarks } = body;

      // Get existing DB items
      const dbRows = await db.select().from(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId));
      const dbItemMap = new Map(dbRows.map(r => [r.id, r]));

      if (localItems && Array.isArray(localItems)) {
        for (const localItem of localItems) {
          const dbItem = dbItemMap.get(localItem.id);
          if (!dbItem) {
            // Item doesn't exist in DB — add it
            await db.insert(memorizationItems).values(itemToDb(localItem, session.userId));
          } else {
            // Item exists in both — keep the one with the more recent lastReviewed
            const dbLast = dbItem.lastReviewed || '';
            const localLast = localItem.lastReviewed || '';
            if (localLast >= dbLast) {
              // Local is newer or equal — update DB with local
              await db.update(memorizationItems)
                .set(itemToDb(localItem, session.userId))
                .where(and(eq(memorizationItems.id, localItem.id), eq(memorizationItems.userId, session.userId)));
            }
            // If DB is newer, keep DB version (do nothing)
          }
        }
      }

      // Merge mistakes — add local mistakes that don't exist in DB
      if (localMistakes) {
        const dbMistakeRows = await db.select().from(mistakes)
          .where(eq(mistakes.userId, session.userId));
        const dbMistakeKeys = new Set(dbMistakeRows.map(r => `${r.surah}:${r.ayah}`));

        const entries = Object.entries(localMistakes as Record<string, any>);
        for (const [key, m] of entries) {
          if (typeof m === 'object' && m !== null && !dbMistakeKeys.has(key)) {
            await db.insert(mistakes).values({
              id: generateId(),
              userId: session.userId,
              surah: m.surah,
              ayah: m.ayah,
              timestamp: m.timestamp,
            });
          }
        }
      }

      // Merge bookmarks — add local bookmarks that don't exist in DB
      if (localBookmarks && Array.isArray(localBookmarks)) {
        const dbBookmarkRows = await db.select().from(bookmarks)
          .where(eq(bookmarks.userId, session.userId));
        const dbBookmarkKeys = new Set(dbBookmarkRows.map(r =>
          `${r.type}:${r.page ?? ''}:${r.surah ?? ''}:${r.ayah ?? ''}`
        ));

        for (const bm of localBookmarks) {
          const key = `${bm.type}:${bm.page ?? ''}:${bm.surah ?? ''}:${bm.ayah ?? ''}`;
          if (!dbBookmarkKeys.has(key)) {
            await db.insert(bookmarks).values({
              id: bm.id || generateId(),
              userId: session.userId,
              type: bm.type,
              page: bm.page ?? null,
              surah: bm.surah ?? null,
              ayah: bm.ayah ?? null,
              label: bm.surahName || bm.label || null,
              createdAt: bm.createdAt || new Date().toISOString(),
            }).onConflictDoNothing();
          }
        }
      }

      // Return the merged result
      const mergedItems = await db.select().from(memorizationItems)
        .where(eq(memorizationItems.userId, session.userId))
        .orderBy(asc(memorizationItems.createdAt));
      const mergedMistakes = await db.select().from(mistakes)
        .where(eq(mistakes.userId, session.userId));
      const mergedBookmarks = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, session.userId))
        .orderBy(desc(bookmarks.createdAt));
      const mistakesRecord: Record<string, any> = {};
      mergedMistakes.forEach(r => {
        mistakesRecord[`${r.surah}:${r.ayah}`] = { timestamp: r.timestamp, surah: r.surah, ayah: r.ayah };
      });

      return NextResponse.json({
        items: mergedItems.map(dbToItem),
        mistakes: mistakesRecord,
        bookmarks: mergedBookmarks.map(r => ({
          id: r.id,
          type: r.type,
          page: r.page,
          surah: r.surah,
          ayah: r.ayah,
          surahName: r.label,
          createdAt: r.createdAt,
        })),
      });
    }

    // ─── Bookmarks ───
    if (op === 'addBookmark') {
      const { type, page, surah, ayah, label, surahName } = body;
      // Check if bookmark already exists (unique per user+target)
      const existing = await db.select().from(bookmarks)
        .where(and(
          eq(bookmarks.userId, session.userId),
          eq(bookmarks.type, type),
          page ? eq(bookmarks.page, page) : undefined,
          surah ? eq(bookmarks.surah, surah) : undefined,
          ayah ? eq(bookmarks.ayah, ayah) : undefined,
        ))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ bookmark: existing[0] });
      }
      const id = generateId();
      await db.insert(bookmarks).values({
        id,
        userId: session.userId,
        type,
        page: page || null,
        surah: surah || null,
        ayah: ayah || null,
        label: label || null,
        surahName: surahName || null,
      });
      return NextResponse.json({ bookmark: { id, userId: session.userId, type, page, surah, ayah, label, surahName } });
    }

    if (op === 'removeBookmark') {
      const { id } = body;
      await db.delete(bookmarks)
        .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, session.userId)));
      return NextResponse.json({ success: true });
    }

    if (op === 'removeBookmarkByTarget') {
      const { type, page, surah, ayah } = body;
      await db.delete(bookmarks)
        .where(and(
          eq(bookmarks.userId, session.userId),
          eq(bookmarks.type, type),
          page ? eq(bookmarks.page, page) : undefined,
          surah ? eq(bookmarks.surah, surah) : undefined,
          ayah ? eq(bookmarks.ayah, ayah) : undefined,
        ));
      return NextResponse.json({ success: true });
    }

    if (op === 'clearAllBookmarks') {
      await db.delete(bookmarks).where(eq(bookmarks.userId, session.userId));
      return NextResponse.json({ success: true });
    }

    if (op === 'saveBookmarks') {
      // Replace all bookmarks (used for sync)
      await db.delete(bookmarks).where(eq(bookmarks.userId, session.userId));
      const items = body.bookmarks as any[];
      if (items.length > 0) {
        await db.insert(bookmarks).values(
          items.map(b => ({
            id: b.id || generateId(),
            userId: session.userId,
            type: b.type,
            page: b.page || null,
            surah: b.surah || null,
            ayah: b.ayah || null,
            label: b.label || null,
            surahName: b.surahName || null,
            createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
          }))
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    console.error('Data POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
