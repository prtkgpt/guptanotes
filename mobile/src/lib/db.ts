import * as SQLite from 'expo-sqlite';
import type { ChecklistItem, Note, NoteColor, NoteStatus } from '../types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('guptanotes.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
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
  created_at: number;
  updated_at: number;
}

function rowToNote(row: NoteRow): Note {
  let checklist: ChecklistItem[] | null = null;
  if (row.checklist) {
    try {
      checklist = JSON.parse(row.checklist) as ChecklistItem[];
    } catch {
      checklist = null;
    }
  }
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    checklist,
    color: row.color as NoteColor,
    pinned: row.pinned === 1,
    status: row.status as NoteStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY updated_at DESC');
  return rows.map(rowToNote);
}

export async function upsertNote(note: Note): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes (id, title, body, checklist, color, pinned, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       body = excluded.body,
       checklist = excluded.checklist,
       color = excluded.color,
       pinned = excluded.pinned,
       status = excluded.status,
       updated_at = excluded.updated_at`,
    note.id,
    note.title,
    note.body,
    note.checklist ? JSON.stringify(note.checklist) : null,
    note.color,
    note.pinned ? 1 : 0,
    note.status,
    note.createdAt,
    note.updatedAt,
  );
}

export async function deleteNoteRow(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
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
