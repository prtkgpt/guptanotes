import type { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { deleteAttachmentQuiet } from '../lib/attachments';
import {
  deleteNoteRow,
  loadNotes,
  loadSetting,
  saveSetting,
  upsertNote,
} from '../lib/db';
import { displayTitle, isEmptyNote, makeId, noteText } from '../lib/noteUtils';
import { cancelReminder, scheduleReminder } from '../lib/reminders';
import { runSync } from '../lib/sync';
import { supabase, syncConfigured } from '../lib/supabaseClient';
import { darkTheme, lightTheme, Theme } from '../theme';
import type { Note, NoteStatus, SortMode, ThemePreference, ViewMode } from '../types';

interface NotesContextValue {
  notes: Note[];
  ready: boolean;
  createNote: (checklist: boolean) => Note;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  /** Set device-local metadata without bumping updatedAt or the dirty flag. */
  updateNoteLocal: (id: string, patch: Partial<Pick<Note, 'reminderNotificationId'>>) => void;
  setNoteStatus: (id: string, status: NoteStatus) => void;
  setReminder: (id: string, when: number | null) => Promise<boolean>;
  discardIfEmpty: (id: string) => void;
  deleteForever: (id: string) => void;
  emptyTrash: () => void;
  // Preferences
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  // Sync
  syncConfigured: boolean;
  session: Session | null;
  syncing: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
  syncNow: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

function cleanupNoteResources(note: Note): void {
  cancelReminder(note.reminderNotificationId).catch(() => {});
  for (const image of note.images) deleteAttachmentQuiet(image.uri);
  for (const clip of note.voice) deleteAttachmentQuiet(clip.uri);
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [sortMode, setSortModeState] = useState<SortMode>('edited');
  const [session, setSession] = useState<Session | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, theme, view, sort, lastSync] = await Promise.all([
          loadNotes(),
          loadSetting('themePreference'),
          loadSetting('viewMode'),
          loadSetting('sortMode'),
          loadSetting('lastSyncAt'),
        ]);
        if (cancelled) return;
        setNotes(loaded);
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          setThemePreferenceState(theme);
        }
        if (view === 'grid' || view === 'list') setViewModeState(view);
        if (sort === 'edited' || sort === 'created' || sort === 'alpha') {
          setSortModeState(sort);
        }
        if (lastSync) setLastSyncAt(Number(lastSync));
      } catch (error) {
        console.warn('Failed to load notes', error);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const persist = useCallback((note: Note, dirty = true) => {
    upsertNote(note, dirty).catch((error) => console.warn('Failed to save note', error));
  }, []);

  const createNote = useCallback(
    (checklist: boolean): Note => {
      const now = Date.now();
      const note: Note = {
        id: makeId(),
        title: '',
        body: '',
        checklist: checklist ? [{ id: makeId(), text: '', done: false }] : null,
        color: 'default',
        pinned: false,
        status: 'active',
        images: [],
        voice: [],
        reminderAt: null,
        reminderNotificationId: null,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [note, ...prev]);
      persist(note);
      return note;
    },
    [persist],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const updated: Note = { ...note, ...patch, updatedAt: Date.now() };
          persist(updated);
          return updated;
        }),
      );
    },
    [persist],
  );

  const updateNoteLocal = useCallback(
    (id: string, patch: Partial<Pick<Note, 'reminderNotificationId'>>) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const updated: Note = { ...note, ...patch };
          persist(updated, false);
          return updated;
        }),
      );
    },
    [persist],
  );

  const setReminder = useCallback(
    async (id: string, when: number | null): Promise<boolean> => {
      const note = notesRef.current.find((n) => n.id === id);
      if (!note) return false;
      await cancelReminder(note.reminderNotificationId);
      let notificationId: string | null = null;
      if (when !== null) {
        notificationId = await scheduleReminder(
          id,
          displayTitle(note),
          noteText(note).split('\n')[0] ?? '',
          when,
        );
        if (!notificationId && when > Date.now()) {
          // Permission denied or unsupported — keep the note unchanged.
          updateNote(id, { reminderAt: null, reminderNotificationId: null });
          return false;
        }
      }
      updateNote(id, { reminderAt: when, reminderNotificationId: notificationId });
      return true;
    },
    [updateNote],
  );

  const setNoteStatus = useCallback(
    (id: string, status: NoteStatus) => {
      const note = notesRef.current.find((n) => n.id === id);
      if (!note) return;
      if (status === 'trashed' && note.reminderNotificationId) {
        cancelReminder(note.reminderNotificationId).catch(() => {});
        updateNote(id, { status, pinned: false, reminderNotificationId: null });
        return;
      }
      if (
        status === 'active' &&
        note.status === 'trashed' &&
        note.reminderAt &&
        note.reminderAt > Date.now()
      ) {
        // Restore re-arms a still-future reminder.
        updateNote(id, { status });
        scheduleReminder(id, displayTitle(note), '', note.reminderAt).then((notifId) =>
          updateNoteLocal(id, { reminderNotificationId: notifId }),
        );
        return;
      }
      updateNote(id, status === 'active' ? { status } : { status, pinned: false });
    },
    [updateNote, updateNoteLocal],
  );

  const deleteForever = useCallback((id: string) => {
    const note = notesRef.current.find((n) => n.id === id);
    if (note) cleanupNoteResources(note);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    deleteNoteRow(id, true).catch((error) => console.warn('Failed to delete note', error));
  }, []);

  const discardIfEmpty = useCallback(
    (id: string) => {
      const note = notesRef.current.find((n) => n.id === id);
      if (note && isEmptyNote(note)) {
        // Never-synced empty draft — no tombstone needed.
        setNotes((prev) => prev.filter((n) => n.id !== id));
        deleteNoteRow(id, false).catch(() => {});
      }
    },
    [],
  );

  const emptyTrash = useCallback(() => {
    const trashed = notesRef.current.filter((note) => note.status === 'trashed');
    setNotes((prev) => prev.filter((note) => note.status !== 'trashed'));
    for (const note of trashed) {
      cleanupNoteResources(note);
      deleteNoteRow(note.id, true).catch((error) =>
        console.warn('Failed to delete note', error),
      );
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!syncConfigured || syncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await runSync({
        getNotes: () => notesRef.current,
        applyRemote: async (incoming) => {
          for (const remote of incoming) {
            const local = notesRef.current.find((n) => n.id === remote.id);
            // Reconcile the device notification with the merged reminder time.
            if (local && local.reminderAt !== remote.reminderAt) {
              await cancelReminder(local.reminderNotificationId);
              remote.reminderNotificationId =
                remote.reminderAt && remote.reminderAt > Date.now() && remote.status === 'active'
                  ? await scheduleReminder(
                      remote.id,
                      displayTitle(remote),
                      noteText(remote).split('\n')[0] ?? '',
                      remote.reminderAt,
                    )
                  : null;
            }
            await upsertNote(remote, false);
          }
          setNotes((prev) => {
            const incomingById = new Map(incoming.map((n) => [n.id, n]));
            const merged = prev.map((n) => incomingById.get(n.id) ?? n);
            const existingIds = new Set(prev.map((n) => n.id));
            const added = incoming.filter((n) => !existingIds.has(n.id));
            return [...added, ...merged];
          });
        },
        removeLocal: async (ids) => {
          for (const id of ids) {
            const note = notesRef.current.find((n) => n.id === id);
            if (note) cleanupNoteResources(note);
            await deleteNoteRow(id, false);
          }
          setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
        },
      });
      const now = Date.now();
      setLastSyncAt(now);
      saveSetting('lastSyncAt', String(now)).catch(() => {});
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Auto-sync shortly after sign-in / app start with a session.
  useEffect(() => {
    if (ready && session) {
      const timer = setTimeout(() => {
        syncNow();
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Sync is not configured';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'Sync is not configured';
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    saveSetting('themePreference', pref).catch(() => {});
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    saveSetting('viewMode', mode).catch(() => {});
  }, []);

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);
    saveSetting('sortMode', mode).catch(() => {});
  }, []);

  const systemScheme = useColorScheme();
  const theme = useMemo(() => {
    const resolved = themePreference === 'system' ? systemScheme : themePreference;
    return resolved === 'dark' ? darkTheme : lightTheme;
  }, [themePreference, systemScheme]);

  const value = useMemo<NotesContextValue>(
    () => ({
      notes,
      ready,
      createNote,
      updateNote,
      updateNoteLocal,
      setNoteStatus,
      setReminder,
      discardIfEmpty,
      deleteForever,
      emptyTrash,
      theme,
      themePreference,
      setThemePreference,
      viewMode,
      setViewMode,
      sortMode,
      setSortMode,
      syncConfigured,
      session,
      syncing,
      lastSyncAt,
      syncError,
      syncNow,
      signIn,
      signUp,
      signOut,
    }),
    [
      notes,
      ready,
      createNote,
      updateNote,
      updateNoteLocal,
      setNoteStatus,
      setReminder,
      discardIfEmpty,
      deleteForever,
      emptyTrash,
      theme,
      themePreference,
      setThemePreference,
      viewMode,
      setViewMode,
      sortMode,
      setSortMode,
      session,
      syncing,
      lastSyncAt,
      syncError,
      syncNow,
      signIn,
      signUp,
      signOut,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
