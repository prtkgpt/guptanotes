# GuptaNotes

> **📱 New: Paperbark mobile app** — a native note-taking app for iPhone and Android
> (React Native + Expo) lives in [`mobile/`](mobile/README.md). Feature research and
> design inspiration from top-rated note apps is documented in
> [`docs/NOTES-APP-BRAINSTORM.md`](docs/NOTES-APP-BRAINSTORM.md).

A personal timeline app for documenting your thoughts, photos, videos, check-ins, and voice notes. Like Twitter, but just for you.

## Tech Stack

- **React + Vite** — Fast dev server and builds
- **Supabase** — Auth, Postgres database, file storage
- **Tailwind CSS** — Utility-first styling
- **Vercel** — Deployment

## Features

- Email/password authentication
- Post types: text, images, videos, voice notes, check-ins
- Single chronological timeline (newest first)
- Voice recording directly in browser (MediaRecorder API)
- GPS check-ins with Google Maps link
- Image and video uploads to Supabase Storage
- Auto-expanding text with "Show more" for long posts
- Delete posts with confirmation dialog
- Cursor-based pagination ("Load more")
- Mobile-friendly responsive design

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor and run `supabase/schema.sql`
3. Create a **Storage bucket** named `media` with public access enabled
4. Add storage RLS policies (see comments in `schema.sql`)
5. Copy your project URL and anon key from Settings > API

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy — Vercel auto-detects Vite

## Post Types

| Type | What it does |
|------|-------------|
| Text | Short thoughts or longer notes |
| Image | Photo with optional caption |
| Video | Short video with optional caption |
| Voice | Audio recording with playback |
| Check-in | Location name with optional GPS coordinates |
