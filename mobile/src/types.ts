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

export interface ImageAttachment {
  id: string;
  /** file:// URI inside the app's document directory */
  uri: string;
  width: number;
  height: number;
}

export interface VoiceAttachment {
  id: string;
  /** file:// URI inside the app's document directory */
  uri: string;
  durationMs: number;
  createdAt: number;
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
  images: ImageAttachment[];
  voice: VoiceAttachment[];
  /** epoch ms of a scheduled reminder, or null */
  reminderAt: number | null;
  /** id of the scheduled OS notification, so it can be cancelled */
  reminderNotificationId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type SortMode = 'edited' | 'created' | 'alpha';

export type ViewMode = 'grid' | 'list';

export type ThemePreference = 'system' | 'light' | 'dark';
