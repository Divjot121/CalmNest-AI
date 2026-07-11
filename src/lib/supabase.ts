import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Browser singleton for client components and Zustand stores
let browserClientInstance: SupabaseClient | null = null;

function getLocalAnonUuid(): string {
  if (typeof window === 'undefined') return '';
  try {
    let uuid = window.localStorage.getItem('calmnest_anon_uuid');
    if (!uuid) {
      const match = document.cookie.match(new RegExp('(^| )calmnest_anon_uuid=([^;]+)'));
      if (match) {
        uuid = decodeURIComponent(match[2]);
      }
    }
    if (!uuid) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        uuid = window.crypto.randomUUID();
      } else {
        uuid = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      }
      window.localStorage.setItem('calmnest_anon_uuid', uuid);
      document.cookie = `calmnest_anon_uuid=${encodeURIComponent(uuid)}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return uuid;
  } catch (e) {
    return '';
  }
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // When running on server side during build or SSR without request context
    return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');
  }
  if (!browserClientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in browser environment.');
    }
    const anonUuid = getLocalAnonUuid();
    const headers: Record<string, string> = {};
    if (anonUuid) {
      headers['x-anon-uuid'] = anonUuid;
    }
    browserClientInstance = createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        global: {
          headers
        }
      }
    );
  }
  return browserClientInstance;
}

export const supabase = getSupabaseBrowserClient();

// Admin client for secure server routes (bypasses RLS)
export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on server.');
  }
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export const supabaseAdmin = getSupabaseAdminClient();

