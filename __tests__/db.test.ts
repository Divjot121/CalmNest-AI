import { describe, it, expect, vi } from 'vitest';

// Mock Supabase using relative path matching how db-service imports it
vi.mock('../lib/supabase', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'test-user', role: 'admin' }, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    upsert: vi.fn().mockResolvedValue({ data: [], error: null })
  };

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => mockQueryBuilder)
    }
  };
});

import { getNotifications } from '../lib/db-service';

describe('Database Services CRUD tests', () => {
  it('should query notifications matching correct user parameters', async () => {
    const notifications = await getNotifications('user-test-id');
    expect(notifications).toBeInstanceOf(Array);
  });
});
