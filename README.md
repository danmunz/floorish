# ⌂ Floorish

A browser-based floor plan studio for arranging furniture to scale. Drop in a floor plan image, calibrate real-world dimensions, and drag furniture from a built-in catalog to plan your space.

## Features

- **Floor plan import** — Load floor plan images via file picker or drag-and-drop
- **Scale calibration** — Set two reference points and a known distance to establish real-world scale; OCR auto-detects printed dimensions via Tesseract.js
- **Furniture catalog** — Pre-built library of common furniture (seating, tables, beds, storage, appliances, bathroom fixtures) with accurate real-world dimensions
- **Drag, rotate, snap** — Place and arrange items on the canvas with rotation, grid snapping, and locking
- **Custom shapes** — Draw arbitrary polygon regions directly on the plan
- **Measurement tool** — Measure distances between any two points in calibrated feet/inches
- **Undo/redo** — Full history with `⌘Z` / `⌘⇧Z`
- **Auto-save** — State persists to localStorage automatically

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

React · TypeScript · Vite · Konva / react-konva · Tesseract.js

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
