const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAuthUser } = require('../src/lib/authUser.ts');

test('sign-in and legacy session-check responses identify the same sync account', () => {
  assert.deepEqual(normalizeAuthUser({ id: 'account', email: 'test@example.com' }), normalizeAuthUser({ userId: 'account', email: 'test@example.com' }));
});
test('signed-out or malformed session responses never create an account binding', () => {
  for (const user of [null, undefined, {}, { id: '', email: 'test@example.com' }, { id: 42, email: 'test@example.com' }]) assert.equal(normalizeAuthUser(user), null);
});
