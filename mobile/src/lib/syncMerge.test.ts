import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Note } from '../types';
import { fromPayload, planMerge, RemoteRow, toPayload } from './syncMerge';

let counter = 0;
function makeNote(overrides: Partial<Note> = {}): Note {
  counter += 1;
  return {
    id: overrides.id ?? `n${counter}`,
    title: 'title',
    body: 'body',
    checklist: null,
    color: 'default',
    pinned: false,
    status: 'active',
    images: [],
    voice: [],
    reminderAt: null,
    reminderNotificationId: null,
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  };
}

function remoteOf(note: Note, updatedAt = note.updatedAt): RemoteRow {
  return { id: note.id, payload: toPayload(note), updated_at: updatedAt, deleted: false };
}

test('payload round-trip strips device-local fields and restores them from local', () => {
  const note = makeNote({
    id: 'a',
    images: [{ id: 'i', uri: 'file://img.jpg', width: 10, height: 10 }],
    voice: [{ id: 'v', uri: 'file://v.m4a', durationMs: 5, createdAt: 1 }],
    reminderAt: 999,
    reminderNotificationId: 'notif-1',
  });
  const payload = toPayload(note);
  assert.ok(!('images' in payload));
  assert.ok(!('reminderNotificationId' in payload));
  const restored = fromPayload('a', remoteOf(note, 200), note);
  assert.equal(restored.updatedAt, 200);
  assert.equal(restored.reminderAt, 999);
  assert.deepEqual(restored.images, note.images);
  assert.deepEqual(restored.voice, note.voice);
  assert.equal(restored.reminderNotificationId, 'notif-1');
});

test('new remote notes are applied locally; new dirty local notes are pushed', () => {
  const local = makeNote({ id: 'local-only', updatedAt: 50 });
  const remoteNote = makeNote({ id: 'remote-only', updatedAt: 60 });
  const plan = planMerge([local], new Set(['local-only']), [], [remoteOf(remoteNote)]);
  assert.deepEqual(plan.applyRemote.map((n) => n.id), ['remote-only']);
  assert.deepEqual(plan.pushNotes.map((n) => n.id), ['local-only']);
  assert.equal(plan.deleteLocal.length, 0);
});

test('last write wins in both directions', () => {
  const older = makeNote({ id: 'x', title: 'local old', updatedAt: 100 });
  const newerRemote = remoteOf(makeNote({ id: 'x', title: 'remote new' }), 200);
  let plan = planMerge([older], new Set(['x']), [], [newerRemote]);
  assert.equal(plan.applyRemote[0]?.title, 'remote new');
  assert.equal(plan.pushNotes.length, 0);

  const newerLocal = makeNote({ id: 'x', title: 'local new', updatedAt: 300 });
  plan = planMerge([newerLocal], new Set(['x']), [], [newerRemote]);
  assert.equal(plan.applyRemote.length, 0);
  assert.deepEqual(plan.pushNotes.map((n) => n.title), ['local new']);
});

test('clean unchanged local note produces no work', () => {
  const note = makeNote({ id: 'same', updatedAt: 100 });
  const plan = planMerge([note], new Set(), [], [remoteOf(note)]);
  assert.equal(plan.applyRemote.length, 0);
  assert.equal(plan.pushNotes.length, 0);
  assert.equal(plan.pushDeletes.length, 0);
});

test('remote delete removes local unless local edit is newer', () => {
  const stale = makeNote({ id: 'gone', updatedAt: 100 });
  const deletedRow: RemoteRow = { id: 'gone', payload: toPayload(stale), updated_at: 150, deleted: true };
  let plan = planMerge([stale], new Set(), [], [deletedRow]);
  assert.deepEqual(plan.deleteLocal, ['gone']);

  const editedAfterDelete = makeNote({ id: 'gone', updatedAt: 200 });
  plan = planMerge([editedAfterDelete], new Set(['gone']), [], [deletedRow]);
  assert.equal(plan.deleteLocal.length, 0);
  assert.deepEqual(plan.pushNotes.map((n) => n.id), ['gone']); // resurrect
});

test('local tombstone pushes a delete unless remote edited later', () => {
  const remoteRow = remoteOf(makeNote({ id: 'd' }), 100);
  let plan = planMerge([], new Set(), [{ id: 'd', deletedAt: 150 }], [remoteRow]);
  assert.deepEqual(plan.pushDeletes.map((t) => t.id), ['d']);

  plan = planMerge([], new Set(), [{ id: 'd', deletedAt: 50 }], [remoteRow]);
  assert.equal(plan.pushDeletes.length, 0);
  assert.deepEqual(plan.applyRemote.map((n) => n.id), ['d']); // remote edit resurrects
  assert.deepEqual(plan.settleTombstones, ['d']);
});

test('tombstone for a note the server never saw still pushes the delete', () => {
  const plan = planMerge([], new Set(), [{ id: 'ghost', deletedAt: 10 }], []);
  assert.deepEqual(plan.pushDeletes.map((t) => t.id), ['ghost']);
});

test('tombstone settles once the server shows the row deleted', () => {
  const row: RemoteRow = { id: 't', payload: null as never, updated_at: 100, deleted: true };
  const plan = planMerge([], new Set(), [{ id: 't', deletedAt: 90 }], [row]);
  assert.deepEqual(plan.settleTombstones, ['t']);
  assert.equal(plan.pushDeletes.length, 0);
});
