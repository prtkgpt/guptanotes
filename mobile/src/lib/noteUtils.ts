import type { ChecklistItem, Note, SortMode } from '../types';

let idCounter = 0;

export function makeId(): string {
  idCounter = (idCounter + 1) % 1_000_000;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const TAG_RE = /(^|[\s(])#([\p{L}\p{N}_-]+)/gu;

/** Bear-style inline tags: every #hashtag typed anywhere in the note. */
export function extractTags(note: Pick<Note, 'title' | 'body' | 'checklist'>): string[] {
  const text = [
    note.title,
    note.body,
    ...(note.checklist ?? []).map((item) => item.text),
  ].join('\n');
  const tags = new Set<string>();
  for (const match of text.matchAll(TAG_RE)) {
    tags.add(match[2].toLowerCase());
  }
  return [...tags].sort();
}

export function allTags(notes: Note[]): string[] {
  const tags = new Set<string>();
  for (const note of notes) {
    for (const tag of extractTags(note)) tags.add(tag);
  }
  return [...tags].sort();
}

export function noteText(note: Note): string {
  return note.checklist
    ? note.checklist.map((item) => item.text).join('\n')
    : note.body;
}

export function matchesSearch(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${note.title}\n${noteText(note)}\n${extractTags(note).join(' ')}`.toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function hasTag(note: Note, tag: string | null): boolean {
  if (!tag) return true;
  return extractTags(note).includes(tag);
}

export function sortNotes(notes: Note[], mode: SortMode): Note[] {
  const sorted = [...notes];
  switch (mode) {
    case 'edited':
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
      break;
    case 'created':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'alpha':
      sorted.sort((a, b) =>
        displayTitle(a).localeCompare(displayTitle(b), undefined, { sensitivity: 'base' }),
      );
      break;
  }
  // Pinned notes always float above unpinned within the same list.
  sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return sorted;
}

export function displayTitle(note: Note): string {
  if (note.title.trim()) return note.title.trim();
  const firstLine = noteText(note)
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ?? 'Untitled';
}

export function isEmptyNote(note: Pick<Note, 'title' | 'body' | 'checklist'>): boolean {
  if (note.title.trim()) return false;
  if (note.checklist) return note.checklist.every((item) => !item.text.trim());
  return !note.body.trim();
}

export function snippet(note: Note, maxLen = 160): string {
  const text = note.checklist ? '' : note.body.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trimEnd()}…`;
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  const real = items.filter((item) => item.text.trim());
  return { done: real.filter((item) => item.done).length, total: real.length };
}

/** Convert a plain-text body into checklist items (one per non-empty line). */
export function bodyToChecklist(body: string): ChecklistItem[] {
  const items = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const checked = /^\[x\]\s*/i.test(line);
      return {
        id: makeId(),
        text: line.replace(/^\[[x ]?\]\s*/i, '').replace(/^[-*]\s+/, ''),
        done: checked,
      };
    });
  return items.length ? items : [{ id: makeId(), text: '', done: false }];
}

/** Convert checklist items back into a plain-text body. */
export function checklistToBody(items: ChecklistItem[]): string {
  return items
    .filter((item) => item.text.trim())
    .map((item) => (item.done ? `[x] ${item.text}` : item.text))
    .join('\n');
}

export function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric',
  });
}
