import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearAdminPinFailures,
  createAdminSecurityRecord,
  getAdminLockSeconds,
  isValidAdminPin,
  recordAdminPinFailure,
  verifyAdminPin,
} from '@/lib/adminSecurity';

test('admin PINs are validated, salted, and verified without storing plaintext', async () => {
  assert.equal(isValidAdminPin('123456'), true);
  assert.equal(isValidAdminPin('1234'), false);
  assert.equal(isValidAdminPin('abcdef'), false);

  const record = await createAdminSecurityRecord('123456');
  assert.equal(record.pinHash.includes('123456'), false);
  assert.equal(record.pinSalt.includes('123456'), false);
  assert.equal(await verifyAdminPin('123456', record), true);
  assert.equal(await verifyAdminPin('654321', record), false);
});

test('five failed PIN attempts trigger a timed lock and success clears failures', () => {
  const now = Date.parse('2026-01-01T00:00:00.000Z');
  let record = {
    version: 1,
    pinHash: 'hash',
    pinSalt: 'salt',
    iterations: 1,
    failedAttempts: 0,
    pinUpdatedAt: '2026-01-01T00:00:00.000Z',
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    record = recordAdminPinFailure(record, now);
  }
  assert.equal(record.failedAttempts, 5);
  assert.equal(getAdminLockSeconds(record, now), 60);

  const cleared = clearAdminPinFailures(record);
  assert.equal(cleared.failedAttempts, 0);
  assert.equal(cleared.lockedUntil, undefined);
});
