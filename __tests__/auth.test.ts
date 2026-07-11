import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/auth';

describe('Authentication Utilities', () => {
  it('should successfully hash and verify password', async () => {
    const password = 'SanctuaryPassword2026';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const matches = await verifyPassword(password, hash);
    expect(matches).toBe(true);

    const mismatches = await verifyPassword('WrongPassword', hash);
    expect(mismatches).toBe(false);
  });
});
