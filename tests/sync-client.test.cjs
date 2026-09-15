const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptySnapshot, applyChanges } = require('../src/lib/syncModel.ts');
const local = require('../src/lib/storage.ts');

function setup() {
  const values = new Map();
  global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  global.window = new EventTarget();
  // Model the browser's cross-tab Web Lock, including requests queued during sync.
  let lock = Promise.resolve();
  Object.defineProperty(global, 'navigator', { configurable: true, value: { locks: { request: (_name, fn) => { const result = lock.then(fn); lock = result.catch(() => {}); return result; } } } });
  let cloud = emptySnapshot(), versions = {}, offline = false, loseResponse = false;
  global.fetch = async (url, options) => {
    if (offline) throw new Error('offline');
    if (url === '/api/auth/me') return { ok: true, json: async () => ({ user: { id: 'alice' } }) };
    const changes = JSON.parse(options.body).changes;
    const result = applyChanges(cloud, changes, versions);
    cloud = result.snapshot; versions = result.versions;
    if (loseResponse) { loseResponse = false; throw new Error('response lost after commit'); }
    return { ok: true, status: 200, json: async () => ({ snapshot: structuredClone(cloud), serverTime: Date.now(), updatedAt: new Date().toISOString() }) };
  };
  const loadClient = () => { delete require.cache[require.resolve('../src/lib/syncClient.ts')]; return require('../src/lib/syncClient.ts'); };
  return { values, loadClient, cloud: () => cloud, offline: value => { offline = value; }, loseResponse: () => { loseResponse = true; }, remote: changes => { const result = applyChanges(cloud, changes, versions); cloud = result.snapshot; versions = result.versions; } };
}
const passage = { id: 'p', surah: 31, ayahStart: 1, ayahEnd: 19, interval: 2, reviewCount: 5, nextReview: '2026-09-16', createdAt: '2026-01-01', easeFactor: 2.5 };

test('offline edit and deletion survive reload and are uploaded on reconnect', async () => {
  const env = setup(); let client = env.loadClient(); client.setSyncUser('alice');
  await client.mutateSyncedData(() => local.addMemorizationItem(passage));
  env.offline(true);
  await client.mutateSyncedData(() => local.updateMemorizationItem({ ...passage, name: 'Offline edit' }));
  assert.equal(client.getSyncStatus().pending, 1);
  client = env.loadClient(); client.setSyncUser('alice');
  assert.equal(local.getMemorizationItem('p').name, 'Offline edit');
  await client.mutateSyncedData(() => local.removeMemorizationItem('p'));
  env.offline(false); await client.synchronizeData(true);
  assert.equal(env.cloud().items.p, undefined);
  assert.equal(client.getSyncStatus().pending, 0);
});
test('a lost response after commit retries safely without losing another device edit', async () => {
  const env = setup(); const client = env.loadClient(); client.setSyncUser('alice');
  await client.synchronizeData(true);
  env.loseResponse();
  await client.mutateSyncedData(() => local.addMemorizationItem(passage));
  assert.equal(client.getSyncStatus().pending, 1);
  env.remote([{ id: 'remote', collection: 'items', key: 'p', value: { ...passage, name: 'Newer remote' }, changedAt: Date.now() + 1000 }]);
  await client.synchronizeData(true);
  assert.equal(local.getMemorizationItem('p').name, 'Newer remote');
  assert.equal(client.getSyncStatus().pending, 0);
});
test('legacy stale device is backed up and silently adopts existing cloud data', async () => {
  const env = setup();
  local.addMemorizationItem({ ...passage, name: 'Old device' });
  env.remote([{ id: 'new', collection: 'items', key: 'p', value: { ...passage, name: 'Cloud' }, changedAt: Date.now() }]);
  const client = env.loadClient(); client.setSyncUser('alice'); await client.synchronizeData(true);
  assert.equal(local.getMemorizationItem('p').name, 'Cloud');
  assert.equal(client.getSyncStatus().hasLegacyBackup, true);
  assert.equal(client.getSyncStatus().pending, 0);
});
test('switching accounts never sends the previous account queue', async () => {
  const env = setup(); const client = env.loadClient(); client.setSyncUser('alice');
  env.offline(true); await client.mutateSyncedData(() => local.addMemorizationItem(passage));
  client.setSyncUser('bob');
  assert.deepEqual(local.getAllMemorizationItems(), []);
  env.offline(false); await client.synchronizeData(true);
  assert.deepEqual(env.cloud().items, {});
  client.setSyncUser('alice');
  assert.equal(client.getSyncStatus().pending, 1);
  assert.equal(local.getMemorizationItem('p').id, 'p');
});
test('concurrent local writes are serialized and neither edit disappears', async () => {
  const env = setup(); const client = env.loadClient(); client.setSyncUser('alice');
  await Promise.all([
    client.mutateSyncedData(() => local.addMemorizationItem(passage)),
    client.mutateSyncedData(() => local.addMemorizationItem({ ...passage, id: 'q' })),
  ]);
  await client.synchronizeData(true);
  assert.deepEqual(Object.keys(env.cloud().items).sort(), ['p', 'q']);
});
test('new guest edits are retained when signing in to an existing account', async () => {
  const env = setup(); const client = env.loadClient(); client.setSyncUser(null);
  await client.mutateSyncedData(() => local.addMemorizationItem(passage));
  env.remote([{ id: 'other', collection: 'items', key: 'q', value: { ...passage, id: 'q' }, changedAt: 1 }]);
  client.setSyncUser('alice'); await client.synchronizeData(true);
  assert.deepEqual(Object.keys(env.cloud().items).sort(), ['p', 'q']);
});
test('bookmark added then removed offline stays deleted after reconnect', async () => {
  const env = setup(); const client = env.loadClient(); client.setSyncUser('alice');
  await client.synchronizeData(true); env.offline(true);
  await client.mutateSyncedData(() => localStorage.setItem('mquran_bookmarks', JSON.stringify([{ id: 'bookmark', type: 'ayah', surah: 31, ayah: 1 }])));
  await client.mutateSyncedData(() => localStorage.setItem('mquran_bookmarks', '[]'));
  env.offline(false); await client.synchronizeData(true);
  assert.deepEqual(env.cloud().bookmarks, {});
});
test('a clean device downloads cloud data using the real legacy /auth/me response shape', async () => {
  const env = setup();
  env.remote([{ id: 'cloud', collection: 'items', key: 'p', value: passage, changedAt: 1 }]);
  const syncFetch = global.fetch;
  global.fetch = (url, options) => url === '/api/auth/me'
    ? Promise.resolve({ ok: true, json: async () => ({ user: { userId: 'alice', email: 'test@example.com' } }) })
    : syncFetch(url, options);
  const client = env.loadClient();
  await client.synchronizeData(true);
  assert.equal(local.getMemorizationItem('p').id, 'p');
  assert.equal(localStorage.getItem('mquran-sync-owner'), 'alice');
  assert.ok(client.getSyncStatus().lastSyncedAt);
});
test('stranded guest edits move into an existing account and are consumed once', async () => {
  const env = setup(); const client = env.loadClient();
  client.setSyncUser('alice'); await client.synchronizeData(true);
  client.setSyncUser(null);
  await client.mutateSyncedData(() => local.addMemorizationItem({ ...passage, name: 'Stranded edit' }));
  client.setSyncUser('alice'); await client.synchronizeData(true);
  assert.equal(env.cloud().items.p.name, 'Stranded edit');
  assert.equal(JSON.parse(localStorage.getItem('mquran-sync-v2:guest')).pending.length, 0);
  client.setSyncUser(null);
  assert.deepEqual(local.getAllMemorizationItems(), []);
});
test('a delayed signed-out session check cannot undo a successful sign-in', async () => {
  const env = setup(); const syncFetch = global.fetch;
  let resolveAuth;
  global.fetch = (url, options) => url === '/api/auth/me'
    ? new Promise(resolve => { resolveAuth = resolve; }) : syncFetch(url, options);
  const client = env.loadClient();
  const sync = client.synchronizeData(true);
  client.setSyncUser('alice');
  resolveAuth({ ok: true, json: async () => ({ user: null }) });
  await sync;
  assert.equal(localStorage.getItem('mquran-sync-owner'), 'alice');
  assert.ok(client.getSyncStatus().lastSyncedAt);
});
