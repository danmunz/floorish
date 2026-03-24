# ⌂ Floorish

**[floorish.vercel.app](https://floorish.vercel.app)**

A browser-based floor plan studio for arranging furniture to scale. Drop in a floor plan image, calibrate real-world dimensions, and drag furniture from a built-in catalog to plan your space.

## Features

- **User accounts** — Sign in with Google to save projects to the cloud; or continue as a guest with local storage
- **Cloud autosave** — Projects, floor plans, and furniture layouts auto-save to Supabase as you work
- **Project management** — Create, rename, and manage multiple projects from a dashboard
- **Floor plan import** — Load floor plan images via file picker or drag-and-drop; images stored in Supabase Storage
- **Scale calibration** — Set two reference points and a known distance to establish real-world scale; OCR auto-detects printed dimensions via Tesseract.js
- **Furniture catalog** — Pre-built library of common furniture (seating, tables, beds, storage, appliances, bathroom fixtures) with accurate real-world dimensions
- **Drag, rotate, snap** — Place and arrange items on the canvas with 15° rotation snapping, grid snapping, and locking
- **Custom shapes** — Draw arbitrary polygon regions directly on the plan
- **Measurement tool** — Measure distances between any two points in calibrated feet/inches
- **Share projects** — Generate read-only share links for collaborators and clients
- **Undo/redo** — Full history with `⌘Z` / `⌘⇧Z`

## Getting Started

```bash
cp .env.example .env.local  # Add your Supabase credentials
npm install
npm run dev
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase db push` (or apply `supabase/migrations/20260324000000_initial_schema.sql` via the SQL editor)
3. Enable Google OAuth in Authentication → Providers → Google
4. Create a Storage bucket named `floor-plans` (private)
5. Copy your project URL and anon key to `.env.local`

The app works without Supabase credentials in **guest mode** (localStorage only).

## Tech Stack

React · TypeScript · Vite · Konva / react-konva · Tesseract.js · Supabase (Auth, Postgres, Storage) · React Router

## Deployment

The app is deployed to **Vercel**. Every push to `main` triggers a build and deploy. The CI pipeline runs tests first — a failing test suite blocks deployment.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` / `Esc` | Select tool |
| `M` | Measure tool |
| `P` | Draw polygon tool |
| `G` | Toggle grid |
| `S` | Toggle snap |
| `⌘D` | Duplicate selected |
| `Delete` | Remove selected |
| `⌘Z` / `⌘⇧Z` | Undo / Redo |
