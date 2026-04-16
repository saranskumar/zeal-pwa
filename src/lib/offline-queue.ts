import { openDB, type IDBPDatabase } from 'idb'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type OfflineTable = 'daily_plans' | 'study_logs' | 'topics' | 'scores'
type OfflineOperation = 'upsert' | 'update' | 'insert'

interface QueuedWrite {
  id:        number
  table:     OfflineTable
  operation: OfflineOperation
  payload:   Record<string, unknown>
  timestamp: number
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

const DB_NAME    = 'zeal-offline'
const STORE_NAME = 'write-queue'
const DB_VERSION = 1

let db: IDBPDatabase | null = null

async function getDB() {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME, {
        keyPath:       'id',
        autoIncrement: true,
      })
    },
  })
  return db
}

// ─── Queue write ──────────────────────────────────────────────────────────────

export async function queueWrite(
  table: OfflineTable,
  operation: OfflineOperation,
  payload: Record<string, unknown>
): Promise<void> {
  const idb = await getDB()
  await idb.add(STORE_NAME, {
    table,
    operation,
    payload,
    timestamp: Date.now(),
  } satisfies Omit<QueuedWrite, 'id'>)
}

// ─── Replay queue ─────────────────────────────────────────────────────────────

/**
 * Replays queued offline writes in chronological order.
 * Called when the app detects `navigator.onLine === true` after being offline.
 *
 * Conflict strategy:
 * - Writes are replayed in timestamp order
 * - upsert uses onConflict to merge cleanly
 * - On success: removes from queue
 * - On failure: leaves in queue for next retry
 */
export async function replayOfflineQueue(
  onConflict?: () => void
): Promise<{ replayed: number; failed: number }> {
  const idb   = await getDB()
  const queue: QueuedWrite[] = await idb.getAll(STORE_NAME)

  // Sort chronologically
  queue.sort((a, b) => a.timestamp - b.timestamp)

  let replayed = 0
  let failed   = 0

  for (const entry of queue) {
    try {
      let error: unknown = null

      if (entry.operation === 'upsert') {
        const result = await supabase.from(entry.table).upsert(entry.payload as any)
        error = result.error
      } else if (entry.operation === 'update') {
        const { id, ...rest } = entry.payload
        const result = await supabase.from(entry.table).update(rest as any).eq('id', id as string)
        error = result.error
      } else {
        const result = await supabase.from(entry.table).insert(entry.payload as any)
        error = result.error
      }

      if (error) {
        console.warn(`[OfflineQueue] Failed to replay ${entry.table} write:`, error)
        // Possible conflict — e.g. rescheduler moved a topic
        onConflict?.()
        failed++
      } else {
        await idb.delete(STORE_NAME, entry.id)
        replayed++
      }
    } catch (err) {
      console.error(`[OfflineQueue] Unexpected error replaying write:`, err)
      failed++
    }
  }

  console.debug(`[OfflineQueue] Replayed ${replayed}, failed ${failed}`)
  return { replayed, failed }
}

export async function getQueueLength(): Promise<number> {
  const idb = await getDB()
  return idb.count(STORE_NAME)
}
