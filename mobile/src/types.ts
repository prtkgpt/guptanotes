export type NoteColor =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sky'
  | 'lavender'
  | 'blush'
  | 'graphite';

export const NOTE_COLORS: NoteColor[] = [
  'default',
  'coral',
  'peach',
  'sand',
  'mint',
  'sky',
  'lavender',
  'blush',
  'graphite',
];

export type NoteStatus = 'active' | 'archived' | 'trashed';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  /** null = plain text note; array = checklist note */
  checklist: ChecklistItem[] | null;
  color: NoteColor;
  pinned: boolean;
  status: NoteStatus;
  createdAt: number;
  updatedAt: number;
}

export type SortMode = 'edited' | 'created' | 'alpha';

export type ViewMode = 'grid' | 'list';

export type ThemePreference = 'system' | 'light' | 'dark';
