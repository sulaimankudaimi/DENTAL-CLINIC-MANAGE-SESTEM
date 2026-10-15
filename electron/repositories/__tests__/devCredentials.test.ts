import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { DEV_CREDENTIALS } from '../../../shared/devCredentials';

test('devCredentials should export valid credentials for all active seed users', () => {
  // mona.ast must be deleted as requested
  assert.equal('mona.ast' in DEV_CREDENTIALS, false, 'mona.ast should not be in DEV_CREDENTIALS');

  // Verify all 5 seed users exist
  const expectedUsers = ['dr.ahmed', 'dr.layla', 'dr.sara', 'sara.rec', 'khaled.acc'];
  for (const u of expectedUsers) {
    assert.ok(DEV_CREDENTIALS[u], `Missing credentials for user ${u}`);
    assert.ok(DEV_CREDENTIALS[u].password, `Missing password for ${u}`);
    assert.ok(DEV_CREDENTIALS[u].pin, `Missing pin for ${u}`);
  }

  // dr.ahmed credentials match seed expectations
  assert.equal(DEV_CREDENTIALS['dr.ahmed'].password, 'Ahmad@Dental2026');
  assert.equal(DEV_CREDENTIALS['dr.ahmed'].pin, '1111');

  // Check bcrypt hash comparison works
  const hash = bcrypt.hashSync(DEV_CREDENTIALS['dr.ahmed'].password, 10);
  assert.equal(bcrypt.compareSync('Ahmad@Dental2026', hash), true);
  assert.equal(bcrypt.compareSync('password123', hash), false);
});
