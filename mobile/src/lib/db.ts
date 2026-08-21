import * as SQLite from 'expo-sqlite';
import type {
  ChecklistItem,
  ImageAttachment,
  Note,
  NoteColor,
  NoteStatus,
  VoiceAttachment,
} from '../types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_VERSION = 2;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        checklist TEXT,
        color TEXT NOT NULL DEFAULT 'default',
        pinned INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  if (version < 2) {
    await db.execAsync(`
      ALTER TABLE notes ADD COLUMN images TEXT;
      ALTER TABLE notes ADD COLUMN voice TEXT;
      ALTER TABLE notes ADD COLUMN reminder_at INTEGER;
      ALTER TABLE notes ADD COLUMN reminder_notification_id TEXT;
      ALTER TABLE notes ADD COLUMN dirty INTEGER NOT NULL DEFAULT 1;
      CREATE TABLE IF NOT EXISTS tombstones (
        id TEXT PRIMARY KEY,
        deleted_at INTEGER NOT NULL
      );
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('paperbark.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

interface NoteRow {
  id: string;
  title: string;
  body: string;
  checklist: string | null;
  color: string;
  pinned: number;
  status: string;
  images: string | null;
  voice: string | null;
  reminder_at: number | null;
  reminder_notification_id: string | null;
  created_at: number;
  updated_at: number;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    checklist: parseJson<ChecklistItem[] | null>(row.checklist, null),
    color: row.color as NoteColor,
    pinned: row.pinned === 1,
    status: row.status as NoteStatus,
    images: parseJson<ImageAttachment[]>(row.images, []),
    voice: parseJson<VoiceAttachment[]>(row.voice, []),
    reminderAt: row.reminder_at,
    reminderNotificationId: row.reminder_notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY updated_at DESC');
  return rows.map(rowToNote);
}

export async function upsertNote(note: Note, dirty = true): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes (id, title, body, checklist, color, pinned, status, images, voice,
                        reminder_at, reminder_notification_id, dirty, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       body = excluded.body,
       checklist = excluded.checklist,
       color = excluded.color,
       pinned = excluded.pinned,
       status = excluded.status,
       images = excluded.images,
       voice = excluded.voice,
       reminder_at = excluded.reminder_at,
       reminder_notification_id = excluded.reminder_notification_id,
       dirty = excluded.dirty,
       updated_at = excluded.updated_at`,
    note.id,
    note.title,
    note.body,
    note.checklist ? JSON.stringify(note.checklist) : null,
    note.color,
    note.pinned ? 1 : 0,
    note.status,
    JSON.stringify(note.images),
    JSON.stringify(note.voice),
    note.reminderAt,
    note.reminderNotificationId,
    dirty ? 1 : 0,
    note.createdAt,
    note.updatedAt,
  );
}

export async function markClean(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE notes SET dirty = 0 WHERE id IN (${placeholders})`, ...ids);
}

export async function loadDirtyIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM notes WHERE dirty = 1');
  return rows.map((r) => r.id);
}

export async function deleteNoteRow(id: string, tombstone: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  if (tombstone) {
    await db.runAsync(
      'INSERT OR REPLACE INTO tombstones (id, deleted_at) VALUES (?, ?)',
      id,
      Date.now(),
    );
  }
}

export async function loadTombstones(): Promise<{ id: string; deletedAt: number }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; deleted_at: number }>(
    'SELECT id, deleted_at FROM tombstones',
  );
  return rows.map((r) => ({ id: r.id, deletedAt: r.deleted_at }));
}

export async function clearTombstones(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM tombstones WHERE id IN (${placeholders})`, ...ids);
}

export async function loadSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}
