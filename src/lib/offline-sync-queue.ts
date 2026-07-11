import { supabase } from './supabase';

export interface QueuedWrite {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
  filter?: Record<string, any>;
  timestamp: string;
}

const STORAGE_KEY = 'calmnest_offline_sync_queue';

// Retrieve queue from localStorage
export function getOfflineQueue(): QueuedWrite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Save queue back to localStorage
function saveOfflineQueue(queue: QueuedWrite[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {}
}

// Queue a failed write
export function queueOfflineWrite(
  table: string,
  operation: 'insert' | 'update' | 'upsert' | 'delete',
  payload: any,
  filter?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  const queue = getOfflineQueue();
  const newWrite: QueuedWrite = {
    id: window.crypto && typeof window.crypto.randomUUID === 'function' 
      ? window.crypto.randomUUID() 
      : 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    table,
    operation,
    payload,
    filter,
    timestamp: new Date().toISOString(),
  };

  queue.push(newWrite);
  saveOfflineQueue(queue);
  console.log(`[Offline Sync Queue] Queued ${operation} for table ${table}. Queue length: ${queue.length}`);
}

// Flush the queue by running all database operations
export async function flushOfflineQueue(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[Offline Sync Queue] Online! Flushing ${queue.length} queued writes...`);
  const remaining: QueuedWrite[] = [];

  for (const item of queue) {
    try {
      let result;
      switch (item.operation) {
        case 'insert':
          result = await supabase.from(item.table).insert(item.payload);
          break;
        case 'update':
          let updateQuery = supabase.from(item.table).update(item.payload);
          if (item.filter) {
            Object.entries(item.filter).forEach(([k, v]) => {
              updateQuery = updateQuery.eq(k, v);
            });
          }
          result = await updateQuery;
          break;
        case 'upsert':
          result = await supabase.from(item.table).upsert(item.payload);
          break;
        case 'delete':
          let deleteQuery = supabase.from(item.table).delete();
          if (item.filter) {
            Object.entries(item.filter).forEach(([k, v]) => {
              deleteQuery = deleteQuery.eq(k, v);
            });
          }
          result = await deleteQuery;
          break;
      }

      if (result.error) {
        console.error(`[Offline Sync Queue] Failed to sync ${item.id} to ${item.table}:`, result.error.message);
        // Keep failed items in queue to retry later
        remaining.push(item);
      } else {
        console.log(`[Offline Sync Queue] Successfully synced ${item.id} to ${item.table}.`);
      }
    } catch (err: any) {
      console.error(`[Offline Sync Queue] Runtime error syncing ${item.id}:`, err.message || err);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
}

// Initialize sync listener in browser context
export function initializeOfflineSyncListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    flushOfflineQueue().catch(err => {
      console.error('[Offline Sync Queue] Sync failed:', err);
    });
  });

  // Attempt initial flush on startup if online
  if (navigator.onLine) {
    flushOfflineQueue().catch(() => {});
  }
}
