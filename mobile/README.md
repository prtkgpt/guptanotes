# Paperbark

A fast, local-first note-taking app for **iPhone and Android**, built with React Native + Expo.
Named after the paperbark tree, whose bark peels into natural sheets of paper.
Design and features are inspired by the best-rated note apps: Google Keep's frictionless
capture and color-coded cards, Bear's inline `#hashtag` tags and minimalist editor, Apple
Notes' pin/archive/search organization, and Obsidian's local-first data ownership.
See [`../docs/NOTES-APP-BRAINSTORM.md`](../docs/NOTES-APP-BRAINSTORM.md) for the full
feature brainstorm and research notes.

## Features

- **Instant capture** — tap the + button, start typing, everything autosaves; empty notes are discarded automatically. No account, no save button.
- **Color-coded cards** — 9 paper-tint colors with matched light and dark variants, shown in a 2-column grid or single-column list.
- **Checklists** — turn any note into a checklist (and back); per-item checkboxes, completed section, progress bar on the card.
- **Inline tags** — type `#groceries` anywhere in a note; tags become filter chips on the home screen.
- **Search** — full-text across titles, bodies, checklist items, and tags.
- **Pin, Archive, Trash** — pinned section on top; soft-delete with restore; permanent delete only from Trash.
- **Sort** — last edited, newest, or A–Z (pinned notes always float).
- **Dark mode** — follows the system, with a manual light/dark override.
- **Share** — export any note through the native iOS/Android share sheet.
- **Reminders** — schedule a local notification per note (quick presets or a custom date & time); tapping the notification opens the note; restoring a trashed note re-arms a still-future reminder.
- **Images** — attach photos from the camera or library; they're copied into app storage, shown as card thumbnails and a full-screen viewer.
- **Voice notes** — record audio clips in the editor with in-place playback and a progress bar.
- **Optional cloud sync** — sign in with email/password (Supabase, the same stack as the web app) to back up and sync notes across devices with last-write-wins merging and offline-safe tombstones. Entirely optional: without configuration the app is 100% local.
- **Local-first** — notes live in an on-device SQLite database; works fully offline.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or press `i` / `a` to launch an iOS simulator / Android emulator.

> Note: scheduled notifications (reminders) are not supported inside Expo Go on
> Android — use a development build (`npx expo run:android` or an EAS dev build)
> to test them there. Everything else works in Expo Go.

### Optional: enable sync

1. Run `supabase/mobile_notes_schema.sql` (repo root) in your Supabase project's SQL editor — the same project the web app uses is fine.
2. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Restart `expo start`. A cloud icon appears in the header for sign-in and manual sync; the app also syncs automatically shortly after launch when signed in.

Notes sync (title, text, checklists, color, pin, status, reminder time). Images and
voice recordings stay on-device in v1.

To produce store-ready binaries, use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas build --platform all
```

## Development

```bash
npm run typecheck   # TypeScript
npm test            # unit tests for the note logic (tags, search, sort, checklists)
```

## Architecture

```
App.tsx                     — providers, notification-tap handling, list ⇄ editor navigation
src/
  types.ts                  — Note, ChecklistItem, attachments, colors, settings types
  theme.ts                  — light/dark themes + per-color card tints
  lib/noteUtils.ts          — pure logic: tag parsing, search, sort, checklist conversion (unit-tested)
  lib/db.ts                 — SQLite persistence (notes, settings, sync tombstones; versioned migrations)
  lib/reminders.ts          — expo-notifications scheduling/cancelling wrappers
  lib/attachments.ts        — copies picked/recorded files into app storage, cleanup
  lib/supabaseClient.ts     — optional Supabase client (null when unconfigured)
  lib/syncMerge.ts          — pure last-write-wins merge planner (unit-tested)
  lib/sync.ts               — pull/push orchestration against the mobile_notes table
  store/NotesContext.tsx    — state + CRUD, autosave, reminder side-effects, auth + sync
  components/               — NoteCard, ChecklistEditor, ColorPicker, TagFilterBar,
                              ReminderPicker, ImageStrip, VoiceNotes, SyncSheet
  screens/                  — NotesListScreen (grid/search/folders), EditorScreen
```

Notes are plain data (`title`, `body` or checklist items, color, pinned, status) — no
proprietary format. Tags are derived from the text on the fly, so there is no tag
database to get out of sync.
