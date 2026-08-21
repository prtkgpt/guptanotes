# Gupta Notes — Feature Brainstorm & Design Inspiration

Research notes behind the mobile app in `mobile/`. Sources: 2026 roundups and reviews of
top-rated note apps (Zapier, NoteApps.info, ClickUp, app store listings for Apple Notes,
Google Keep, Bear, Obsidian, OneNote, Notion, UpNote).

## What the highest-rated apps get right

| App | Why people love it | What we borrowed |
|---|---|---|
| **Google Keep** | Frictionless capture — open, type, done. Color-coded cards, masonry grid, pin to top, labels, checklists. | FAB → instant blank note with autosave; 8-color card palette; grid/list toggle; pinned section; checklists with progress. |
| **Apple Notes** | "Safe default": fast search, folders, pinning, checklists, everything just syncs and works. | Pin/archive/trash lifecycle with restore; instant full-text search; sort options. |
| **Bear** | Beautiful minimalist writing space, `#hashtag` tags typed inline, themes, word counts. | Tags are parsed live from `#hashtags` in the note body — no separate tagging UI; tag filter chips; word/char count in editor; warm serif-free typography, generous whitespace. |
| **Obsidian** | Local-first, your data is yours, works offline, no account required. | 100% offline, on-device SQLite. No sign-up, no network permission needed. Export/share as plain text. |
| **OneNote / UpNote** | No save button — everything autosaves continuously. | Debounced autosave on every keystroke; empty notes are auto-discarded. |
| **Notion** | Flexible blocks — but widely criticized as heavy for quick notes. | Deliberately **not** copied: v1 stays a fast capture tool, not a workspace. |

## 2026 trends observed
- AI transcription/summarization is the big differentiator in paid apps — out of scope for v1 (local-first, no network), listed under future ideas.
- "Local-first + optional sync" is the trust posture users increasingly demand.
- Dark mode is table stakes; the best apps follow the system and allow override.

## v1 feature set (implemented)
1. Instant capture: FAB opens a new note, autosaves, discards if left empty.
2. Notes as color-coded cards; 2-column masonry grid or single-column list.
3. Pin notes to a "Pinned" section.
4. Checklists: toggle any note into checklist mode, per-item checkboxes, progress bar on cards, "N of M done".
5. Inline `#hashtag` tags parsed from note text; horizontally scrollable tag filter chips.
6. Full-text search across titles, bodies, and tags.
7. Archive and Trash (soft delete) with restore; permanent delete only from Trash.
8. Sort: last edited / newest / alphabetical.
9. Light & dark themes: follows system, manual override persisted.
10. Share/export any note via the native share sheet.
11. Word & character count and "edited …" timestamp in the editor.
12. Local-first storage: SQLite on device, works fully offline, no account.

## Future ideas (not in v1)
- Reminders/notifications per note (Keep), note locking with biometrics (Apple Notes),
  images & drawing, voice notes with transcription, optional cloud sync (Supabase — the
  repo's web stack), note linking (Obsidian), widgets, AI summaries.

## Design language
- Keep-inspired card grid, Bear-inspired editor: no chrome while writing, controls fade to the edges.
- Palette: soft paper tints in light mode, muted deep tones in dark mode; each note color has a light and a dark variant.
- Type: system fonts (SF on iOS, Roboto on Android), 17pt body in the editor for comfortable long-form writing.
