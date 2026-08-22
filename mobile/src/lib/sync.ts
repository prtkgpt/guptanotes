import {
  clearTombstones,
  loadDirtyIds,
  loadTombstones,
  markClean,
} from './db';
import { supabase } from './supabaseClient';
import { planMerge, RemoteRow, toPayload } from './syncMerge';
import type { Note } from '../types';

const TABLE = 'mobile_notes';

export interface SyncHandlers {
  /** Current in-memory notes. */
  getNotes: () => Note[];
  /** Write remote versions into local state + SQLite (stored clean). */
  applyRemote: (notes: Note[]) => Promise<void>;
  /** Hard-delete local notes (no tombstone — the server already knows). */
  removeLocal: (ids: string[]) => Promise<void>;
}

export interface SyncResult {
  pulled: number;
  pushed: number;
  deletedLocally: number;
}

export async function runSync(handlers: SyncHandlers): Promise<SyncResult> {
  if (!supabase) throw new Error('Sync is not configured');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not signed in');

  const [dirtyIds, tombstones] = await Promise.all([loadDirtyIds(), loadTombstones()]);
  const { data: remoteRows, error: fetchError } = await supabase
    .from(TABLE)
    .select('id, payload, updated_at, deleted');
  if (fetchError) throw new Error(fetchError.message);

  const plan = planMerge(
    handlers.getNotes(),
    new Set(dirtyIds),
    tombstones,
    (remoteRows ?? []) as RemoteRow[],
  );

  // Pull first so pushes are based on the merged view.
  if (plan.applyRemote.length > 0) await handlers.applyRemote(plan.applyRemote);
  if (plan.deleteLocal.length > 0) await handlers.removeLocal(plan.deleteLocal);

  const upserts = [
    ...plan.pushNotes.map((note) => ({
      id: note.id,
      payload: toPayload(note),
      updated_at: note.updatedAt,
      deleted: false,
    })),
    ...plan.pushDeletes.map((tomb) => ({
      id: tomb.id,
      payload: null,
      updated_at: tomb.deletedAt,
      deleted: true,
    })),
  ];
  if (upserts.length > 0) {
    const { error: pushError } = await supabase.from(TABLE).upsert(upserts);
    if (pushError) throw new Error(pushError.message);
  }

  await markClean(plan.pushNotes.map((n) => n.id));
  await clearTombstones([
    ...plan.settleTombstones,
    ...plan.pushDeletes.map((t) => t.id),
  ]);

  return {
    pulled: plan.applyRemote.length,
    pushed: upserts.length,
    deletedLocally: plan.deleteLocal.length,
  };
}
