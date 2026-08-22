import type { ChecklistItem, Note, NoteColor, NoteStatus } from '../types';

/**
 * The synced representation of a note. Device-local fields — attachment file
 * URIs and the OS notification id — are deliberately excluded: attachments
 * stay on-device in v1, and notification ids are meaningless across devices.
 */
export interface NotePayload {
  title: string;
  body: string;
  checklist: ChecklistItem[] | null;
  color: NoteColor;
  pinned: boolean;
  status: NoteStatus;
  reminderAt: number | null;
  createdAt: number;
}

export interface RemoteRow {
  id: string;
  payload: NotePayload;
  updated_at: number;
  deleted: boolean;
}

export interface Tombstone {
  id: string;
  deletedAt: number;
}

export function toPayload(note: Note): NotePayload {
  return {
    title: note.title,
    body: note.body,
    checklist: note.checklist,
    color: note.color,
    pinned: note.pinned,
    status: note.status,
    reminderAt: note.reminderAt,
    createdAt: note.createdAt,
  };
}

export function fromPayload(id: string, row: RemoteRow, local: Note | undefined): Note {
  const p = row.payload;
  return {
    id,
    title: p.title ?? '',
    body: p.body ?? '',
    checklist: p.checklist ?? null,
    color: p.color ?? 'default',
    pinned: p.pinned ?? false,
    status: p.status ?? 'active',
    reminderAt: p.reminderAt ?? null,
    createdAt: p.createdAt ?? row.updated_at,
    updatedAt: row.updated_at,
    // Device-local fields survive the merge.
    images: local?.images ?? [],
    voice: local?.voice ?? [],
    reminderNotificationId: local?.reminderNotificationId ?? null,
  };
}

export interface MergePlan {
  /** Remote versions to write locally (stored clean). */
  applyRemote: Note[];
  /** Local notes to hard-delete because they were deleted elsewhere. */
  deleteLocal: string[];
  /** Local notes to upsert to the server. */
  pushNotes: Note[];
  /** Deletions to propagate to the server. */
  pushDeletes: Tombstone[];
  /** Tombstones that are settled and can be dropped. */
  settleTombstones: string[];
}

/**
 * Pure last-write-wins merge between local state and the full remote set.
 * Newer `updatedAt` wins in both directions; deletions carry their own
 * timestamp so an edit made after a delete resurrects the note.
 */
export function planMerge(
  localNotes: Note[],
  dirtyIds: Set<string>,
  tombstones: Tombstone[],
  remote: RemoteRow[],
): MergePlan {
  const plan: MergePlan = {
    applyRemote: [],
    deleteLocal: [],
    pushNotes: [],
    pushDeletes: [],
    settleTombstones: [],
  };
  const localById = new Map(localNotes.map((n) => [n.id, n]));
  const tombstoneById = new Map(tombstones.map((t) => [t.id, t]));
  const remoteById = new Map(remote.map((r) => [r.id, r]));

  for (const row of remote) {
    const local = localById.get(row.id);
    const tomb = tombstoneById.get(row.id);
    if (row.deleted) {
      if (local) {
        if (local.updatedAt > row.updated_at) {
          plan.pushNotes.push(local); // local edit is newer than the remote delete
        } else {
          plan.deleteLocal.push(row.id);
        }
      }
      if (tomb) plan.settleTombstones.push(row.id); // both sides agree it's gone
    } else if (tomb) {
      if (tomb.deletedAt >= row.updated_at) {
        plan.pushDeletes.push(tomb);
      } else {
        plan.applyRemote.push(fromPayload(row.id, row, undefined)); // remote edit is newer, resurrect
        plan.settleTombstones.push(row.id);
      }
    } else if (!local) {
      plan.applyRemote.push(fromPayload(row.id, row, undefined));
    } else if (row.updated_at > local.updatedAt) {
      plan.applyRemote.push(fromPayload(row.id, row, local));
    } else if (dirtyIds.has(local.id)) {
      plan.pushNotes.push(local);
    }
  }

  for (const note of localNotes) {
    if (dirtyIds.has(note.id) && !remoteById.has(note.id)) {
      plan.pushNotes.push(note);
    }
  }
  for (const tomb of tombstones) {
    if (!remoteById.has(tomb.id)) {
      plan.pushDeletes.push(tomb);
    }
  }
  return plan;
}
