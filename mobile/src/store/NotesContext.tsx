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
import {
  deleteNoteRow,
  loadNotes,
  loadSetting,
  saveSetting,
  upsertNote,
} from '../lib/db';
import { isEmptyNote, makeId } from '../lib/noteUtils';
import { darkTheme, lightTheme, Theme } from '../theme';
import type { Note, SortMode, ThemePreference, ViewMode } from '../types';

interface NotesContextValue {
  notes: Note[];
  ready: boolean;
  createNote: (checklist: boolean) => Note;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  /** Deletes the note outright if it has no content, otherwise leaves it saved. */
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
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [sortMode, setSortModeState] = useState<SortMode>('edited');
  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, theme, view, sort] = await Promise.all([
          loadNotes(),
          loadSetting('themePreference'),
          loadSetting('viewMode'),
          loadSetting('sortMode'),
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

  const persist = useCallback((note: Note) => {
    upsertNote(note).catch((error) => console.warn('Failed to save note', error));
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

  const deleteForever = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    deleteNoteRow(id).catch((error) => console.warn('Failed to delete note', error));
  }, []);

  const discardIfEmpty = useCallback(
    (id: string) => {
      const note = notesRef.current.find((n) => n.id === id);
      if (note && isEmptyNote(note)) deleteForever(id);
    },
    [deleteForever],
  );

  const emptyTrash = useCallback(() => {
    const trashed = notesRef.current.filter((note) => note.status === 'trashed');
    setNotes((prev) => prev.filter((note) => note.status !== 'trashed'));
    for (const note of trashed) {
      deleteNoteRow(note.id).catch((error) => console.warn('Failed to delete note', error));
    }
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
    }),
    [
      notes,
      ready,
      createNote,
      updateNote,
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
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
