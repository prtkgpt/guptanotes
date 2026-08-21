# Gupta Notes — Mobile

A fast, local-first note-taking app for **iPhone and Android**, built with React Native + Expo.
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
- **Local-first** — notes live in an on-device SQLite database; works fully offline.

## Run it

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or press `i` / `a` to launch an iOS simulator / Android emulator.

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
App.tsx                     — providers + two-screen navigation (list ⇄ editor)
src/
  types.ts                  — Note, ChecklistItem, colors, settings types
  theme.ts                  — light/dark themes + per-color card tints
  lib/noteUtils.ts          — pure logic: tag parsing, search, sort, checklist conversion (unit-tested)
  lib/db.ts                 — SQLite persistence (notes + settings tables)
  store/NotesContext.tsx    — state + CRUD, autosave to SQLite, theme/view/sort prefs
  components/               — NoteCard, ChecklistEditor, ColorPicker, TagFilterBar
  screens/                  — NotesListScreen (grid/search/folders), EditorScreen
```

Notes are plain data (`title`, `body` or checklist items, color, pinned, status) — no
proprietary format. Tags are derived from the text on the fly, so there is no tag
database to get out of sync.
