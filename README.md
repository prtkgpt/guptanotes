# GuptaNotes

A lightweight Notion clone built with React, TipTap, and Supabase.

## Tech Stack

- **React + Vite** — Fast dev server and builds
- **TipTap** — Rich text editor with slash commands
- **Supabase** — Auth, Postgres database, Row Level Security
- **Tailwind CSS** — Utility-first styling
- **Vercel** — Deployment

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

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

## Features

- Email/password authentication
- Nested page tree with drag-and-drop
- Rich text editor with slash command menu (`/`)
- Auto-save (debounced 2s)
- Block types: headings, lists, to-dos, code blocks, dividers
- Right-click context menu for delete/sub-pages
- Clean, minimal UI inspired by Notion
