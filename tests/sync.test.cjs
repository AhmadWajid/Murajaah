const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptySnapshot, applyChanges, diffSnapshots } = require('../src/lib/syncModel.ts');
const edit = (id, key, changedAt, value, collection = 'items') => ({ id, key, changedAt, value, collection });

test('newer edit wins even if an older offline device reconnects later', () => {
  const cloud = applyChanges(emptySnapshot(), [edit('new', 'a', 200, { name: 'New name', reviewCount: 1 })]);
  const merged = applyChanges(cloud.snapshot, [edit('old', 'a', 100, { name: 'Old name', reviewCount: 99 })], cloud.versions);
  assert.equal(merged.snapshot.items.a.name, 'New name');
});
test('independent device edits are both retained', () => {
  const a = applyChanges(emptySnapshot(), [edit('a', 'passage', 100, { name: 'Passage' })]);
  const b = applyChanges(a.snapshot, [edit('b', '31:2', 200, { surah: 31, ayah: 2 }, 'mistakes')], a.versions);
  assert.equal(b.snapshot.items.passage.name, 'Passage');
  assert.equal(b.snapshot.mistakes['31:2'].ayah, 2);
});
for (const collection of ['items', 'mistakes', 'bookmarks']) {
  test(`${collection}: deletion survives stale-device replay, newer intentional re-add works`, () => {
    const deleted = applyChanges(emptySnapshot(), [edit('delete', 'a', 200, null, collection)]);
    const stale = applyChanges(deleted.snapshot, [edit('stale', 'a', 100, { name: 'Old' }, collection)], deleted.versions);
    assert.equal(stale.snapshot[collection].a, undefined);
    const added = applyChanges(stale.snapshot, [edit('readd', 'a', 300, { name: 'New' }, collection)], stale.versions);
    assert.equal(added.snapshot[collection].a.name, 'New');
  });
}
test('equal timestamp conflicts converge regardless of arrival order', () => {
  const changes = [edit('a', 'a', 100, { name: 'A' }), edit('b', 'a', 100, { name: 'B' })];
  assert.deepEqual(applyChanges(emptySnapshot(), changes).snapshot, applyChanges(emptySnapshot(), [...changes].reverse()).snapshot);
});
test('retrying a committed change is idempotent, including adjusted clocks', () => {
  const first = applyChanges(emptySnapshot(), [edit('same', 'a', 100, { name: 'A' })]);
  assert.equal(applyChanges(first.snapshot, [edit('same', 'a', 200, { name: 'A' })], first.versions).accepted.length, 0);
});
test('unchanged snapshots produce no edits; deletions are explicit', () => {
  const base = emptySnapshot(); base.items.a = { name: 'A', reviewCount: 2 };
  assert.deepEqual(diffSnapshots(base, structuredClone(base), 100, () => 'id'), []);
  const changes = diffSnapshots(base, emptySnapshot(), 100, () => 'id');
  assert.equal(changes.length, 1); assert.equal(changes[0].value, null);
});
test('database passage IDs remain account-scoped while URLs keep the original passage ID', () => {
  const { dbToItem } = require('../src/lib/neon/converters.ts');
  assert.equal(dbToItem({ id: 'alice/31:1-19', userId: 'alice' }).id, '31:1-19');
  assert.equal(dbToItem({ id: 'bob/31:1-19', userId: 'bob' }).id, '31:1-19');
  assert.equal(dbToItem({ id: '31:1-19', userId: 'alice' }).id, '31:1-19');
});
