# ⌂ Floorish

**[floorish.vercel.app](https://floorish.vercel.app)**

A browser-based floor plan studio for arranging furniture to scale. Drop in a floor plan image, calibrate real-world dimensions, and drag furniture from a built-in catalog to plan your space.

## Features

- **User accounts** — Sign in with Google to save projects to the cloud; or continue as a guest with local storage
- **Cloud autosave** — Signed-in users always autosave to Supabase while editing, with visible save status in the workspace header
- **Smart project creation** — A cloud project is created automatically on first calibration as New Project, then New Project 2, New Project 3, and so on
- **Project management** — Rename projects at any time from the workspace header or project dashboard, and manage multiple projects from the dashboard
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
cp .env.example .env.local  # Add your Supabase credentials (and optional Buy Me a Coffee slug)
npm install
npm run dev
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase db push` (or apply `supabase/migrations/20260324000000_initial_schema.sql` via the SQL editor)
3. Enable Google OAuth in Authentication → Providers → Google
4. Create a Storage bucket named `floor-plans` (private)
5. Copy your project URL and anon key to `.env.local`

When adding new schema changes, commit SQL files under `supabase/migrations` and apply them with `supabase db push` in each environment.

The app works without Supabase credentials in **guest mode** (localStorage only).

### Optional Buy Me a Coffee Button

Set `VITE_BMC_SLUG` in `.env.local` to show the official Buy Me a Coffee button embed in the signed-in user menu.

## Tech Stack

React · TypeScript · Vite · Konva / react-konva · Tesseract.js · Supabase (Auth, Postgres, Storage) · React Router

## Deployment

The app is deployed to **Vercel**. Every push to `main` triggers a build and deploy. The CI pipeline runs tests first — a failing test suite blocks deployment.

## Data Safety Guardrails

### Environment Isolation

Use separate Supabase projects for `dev`, `preview`, and `production`.

- Vercel preview deployments must use preview Supabase credentials.
- Production deployment must use production credentials only.
- Never run experimental migrations against production first.

### Migration Safety Gate

CI runs `scripts/check-migration-safety.sh` for every PR and push to `main`.

- It blocks migrations that contain high-risk statements like `DROP TABLE`, `TRUNCATE TABLE`, or `ALTER TABLE ... DROP COLUMN`.
- If a destructive migration is truly intentional, add `safety:allow-destructive` with a clear inline justification in that migration and require manual review.

### Project Soft Delete

Project deletion is soft-delete based (`projects.deleted_at`) so users can restore archived projects from the Project Picker.

- Delete moves a project to **Archived Projects**.
- Restore clears `deleted_at` and returns it to active projects.
- This prevents accidental permanent loss from UI delete actions.

### Supabase Backup & Restore Runbook

Supabase backup retention and PITR availability depend on your plan. Verify settings directly in the dashboard for each environment.

1. Open **Supabase Dashboard → Database → Backups**.
2. Confirm automatic backups are enabled and note retention period.
3. Enable Point-in-Time Recovery (PITR) if your plan supports it.
4. Before any risky migration, create an on-demand backup/snapshot.
5. Keep SQL migrations in git so schema state is reproducible.

Restore drill checklist (run monthly in a non-prod project):

1. Restore a backup into a staging project.
2. Log in to Floorish staging and open several real projects.
3. Verify floor plans, furniture, and calibration values load correctly.
4. Verify recent archived projects can be restored.
5. Record restore duration and any issues in your ops notes.

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
