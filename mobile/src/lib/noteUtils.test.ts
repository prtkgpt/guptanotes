import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Note } from '../types';
import {
  bodyToChecklist,
  checklistProgress,
  checklistToBody,
  displayTitle,
  extractTags,
  formatRelativeTime,
  isEmptyNote,
  makeId,
  matchesSearch,
  snippet,
  sortNotes,
  wordCount,
} from './noteUtils';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: makeId(),
    title: '',
    body: '',
    checklist: null,
    color: 'default',
    pinned: false,
    status: 'active',
    images: [],
    voice: [],
    reminderAt: null,
    reminderNotificationId: null,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

test('isEmptyNote counts attachments and reminders as content', () => {
  assert.ok(
    !isEmptyNote(makeNote({ images: [{ id: '1', uri: 'file://x.jpg', width: 1, height: 1 }] })),
  );
  assert.ok(
    !isEmptyNote(
      makeNote({ voice: [{ id: '1', uri: 'file://x.m4a', durationMs: 100, createdAt: 1 }] }),
    ),
  );
  assert.ok(!isEmptyNote(makeNote({ reminderAt: 123 })));
});

test('extractTags finds inline hashtags, dedupes, lowercases', () => {
  const note = makeNote({
    title: 'Groceries #Errands',
    body: 'Buy milk #errands and #home-stuff (#urgent)',
  });
  assert.deepEqual(extractTags(note), ['errands', 'home-stuff', 'urgent']);
});

test('extractTags reads checklist items and ignores mid-word #', () => {
  const note = makeNote({
    body: 'C# is not a tag but room#5 neither',
    checklist: [{ id: '1', text: 'call plumber #home', done: false }],
  });
  assert.deepEqual(extractTags(note), ['home']);
});

test('matchesSearch matches title, body, tags; all words must hit', () => {
  const note = makeNote({ title: 'Trip plan', body: 'Pack bags #travel' });
  assert.ok(matchesSearch(note, 'trip'));
  assert.ok(matchesSearch(note, 'pack travel'));
  assert.ok(matchesSearch(note, ''));
  assert.ok(!matchesSearch(note, 'pack hotel'));
});

test('sortNotes floats pinned notes and sorts within groups', () => {
  const a = makeNote({ title: 'apple', updatedAt: 1, createdAt: 3 });
  const b = makeNote({ title: 'banana', updatedAt: 3, createdAt: 1 });
  const c = makeNote({ title: 'cherry', updatedAt: 2, createdAt: 2, pinned: true });
  assert.deepEqual(
    sortNotes([a, b, c], 'edited').map((n) => n.title),
    ['cherry', 'banana', 'apple'],
  );
  assert.deepEqual(
    sortNotes([a, b, c], 'alpha').map((n) => n.title),
    ['cherry', 'apple', 'banana'],
  );
  assert.deepEqual(
    sortNotes([a, b, c], 'created').map((n) => n.title),
    ['cherry', 'apple', 'banana'],
  );
});

test('displayTitle falls back to first non-empty line, then Untitled', () => {
  assert.equal(displayTitle(makeNote({ title: '  My note  ' })), 'My note');
  assert.equal(displayTitle(makeNote({ body: '\n\nfirst line\nsecond' })), 'first line');
  assert.equal(
    displayTitle(makeNote({ checklist: [{ id: '1', text: 'milk', done: false }] })),
    'milk',
  );
  assert.equal(displayTitle(makeNote()), 'Untitled');
});

test('isEmptyNote treats whitespace-only content as empty', () => {
  assert.ok(isEmptyNote(makeNote({ body: '   \n ' })));
  assert.ok(isEmptyNote(makeNote({ checklist: [{ id: '1', text: ' ', done: false }] })));
  assert.ok(!isEmptyNote(makeNote({ title: 'x' })));
  assert.ok(!isEmptyNote(makeNote({ checklist: [{ id: '1', text: 'x', done: false }] })));
});

test('checklist round-trips through body text preserving done state', () => {
  const items = bodyToChecklist('milk\n[x] eggs\n- bread\n');
  assert.deepEqual(
    items.map((i) => ({ text: i.text, done: i.done })),
    [
      { text: 'milk', done: false },
      { text: 'eggs', done: true },
      { text: 'bread', done: false },
    ],
  );
  assert.equal(checklistToBody(items), 'milk\n[x] eggs\nbread');
});

test('bodyToChecklist on empty body yields one blank item', () => {
  const items = bodyToChecklist('');
  assert.equal(items.length, 1);
  assert.equal(items[0].text, '');
});

test('checklistProgress ignores blank items', () => {
  const { done, total } = checklistProgress([
    { id: '1', text: 'a', done: true },
    { id: '2', text: '', done: false },
    { id: '3', text: 'b', done: false },
  ]);
  assert.equal(done, 1);
  assert.equal(total, 2);
});

test('snippet truncates long bodies with ellipsis', () => {
  const note = makeNote({ body: 'x'.repeat(300) });
  const s = snippet(note, 100);
  assert.ok(s.length <= 101);
  assert.ok(s.endsWith('…'));
  assert.equal(snippet(makeNote({ body: 'short' })), 'short');
});

test('wordCount', () => {
  assert.equal(wordCount('  hello   world '), 2);
  assert.equal(wordCount(''), 0);
});

test('formatRelativeTime buckets', () => {
  const now = 1_700_000_000_000;
  assert.equal(formatRelativeTime(now - 10_000, now), 'just now');
  assert.equal(formatRelativeTime(now - 5 * 60_000, now), '5m ago');
  assert.equal(formatRelativeTime(now - 3 * 3_600_000, now), '3h ago');
  assert.equal(formatRelativeTime(now - 2 * 86_400_000, now), '2d ago');
});

test('makeId produces unique ids', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => makeId()));
  assert.equal(ids.size, 1000);
});
