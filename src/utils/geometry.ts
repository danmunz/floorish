import type { DetectedDimension, Point } from '../types';

/**
 * Parse dimension strings like 14'3" x 12', 21' x 20'6", 16'10", etc.
 * Returns { feet, inches, totalFeet } for each match.
 */
const DIMENSION_PATTERN = /(\d{1,3})[''′]\s*(\d{1,2})?[""″]?/g;
const PAIR_PATTERN = /(\d{1,3})[''′]\s*(\d{0,2})[""″]?\s*[xX×]\s*(\d{1,3})[''′]\s*(\d{0,2})[""″]?/g;

export function parseDimensionText(text: string): DetectedDimension[] {
  const results: DetectedDimension[] = [];
  const seen = new Set<string>();

  // First try to find paired dimensions like "14'3" x 12'"
  let match: RegExpExecArray | null;
  PAIR_PATTERN.lastIndex = 0;
  while ((match = PAIR_PATTERN.exec(text)) !== null) {
    const dims = [
      { feet: parseInt(match[1]), inches: parseInt(match[2]) || 0 },
      { feet: parseInt(match[3]), inches: parseInt(match[4]) || 0 },
    ];
    for (const d of dims) {
      const total = d.feet + d.inches / 12;
      const key = `${d.feet}'${d.inches}"`;
      if (!seen.has(key) && total > 2 && total < 50) {
        seen.add(key);
        results.push({ text: key, feet: d.feet, inches: d.inches, totalFeet: total });
      }
    }
  }

  // Then find single dimensions
  DIMENSION_PATTERN.lastIndex = 0;
  while ((match = DIMENSION_PATTERN.exec(text)) !== null) {
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]) || 0;
    const total = feet + inches / 12;
    const key = `${feet}'${inches}"`;
    if (!seen.has(key) && total > 2 && total < 50) {
      seen.add(key);
      results.push({ text: key, feet, inches, totalFeet: total });
    }
  }

  return results;
}

/**
 * Compute the Euclidean distance between two points.
 */
export function pixelDistance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Given two points and a known real-world distance, compute pixels per foot.
 */
export function computePixelsPerFoot(a: Point, b: Point, distanceFt: number): number {
  return pixelDistance(a, b) / distanceFt;
}

/**
 * Convert inches to canvas pixels.
 */
export function inchesToPixels(inches: number, pixelsPerFoot: number): number {
  return (inches / 12) * pixelsPerFoot;
}

/**
 * Convert canvas pixels to inches.
 */
export function pixelsToInches(px: number, pixelsPerFoot: number): number {
  return (px / pixelsPerFoot) * 12;
}

/**
 * Convert pixels to feet (for display).
 */
export function pixelsToFeet(px: number, pixelsPerFoot: number): number {
  return px / pixelsPerFoot;
}

/**
 * Format a distance in feet as a readable string like 14'3"
 */
export function formatFeetInches(totalFeet: number): string {
  const feet = Math.floor(totalFeet);
  const inches = Math.round((totalFeet - feet) * 12);
  if (inches === 0) return `${feet}'`;
  if (inches === 12) return `${feet + 1}'`;
  return `${feet}'${inches}"`;
}

/**
 * Snap a value to the nearest grid increment.
 */
export function snapToGridValue(value: number, gridPx: number): number {
  return Math.round(value / gridPx) * gridPx;
}

/**
 * Snap an angle to the nearest increment (in degrees).
 */
export function snapAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment;
}

/**
 * Check if two axis-aligned rectangles overlap.
 * (Simplified – for rotated rectangles, a more complex check is needed.)
 */
export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Calculate the optimal font size for a label to fit within the given bounds.
 * Returns 0 if the text cannot fit at the minimum font size (signal to hide).
 */
export function calculateLabelFontSize(
  text: string,
  availWidth: number,
  availHeight: number,
  options?: { minSize?: number; maxSize?: number; maxLines?: number }
): number {
  const minSize = options?.minSize ?? 7;
  const maxSize = options?.maxSize ?? 18;
  const maxLines = options?.maxLines ?? 3;
  const charWidthRatio = 0.6; // average character width / fontSize for DM Sans
  const lineHeightRatio = 1.3;

  if (availWidth <= 0 || availHeight <= 0 || text.length === 0) return 0;

  for (let size = maxSize; size >= minSize; size--) {
    const charWidth = size * charWidthRatio;
    const charsPerLine = Math.floor(availWidth / charWidth);
    if (charsPerLine < 1) continue;
    const linesNeeded = Math.ceil(text.length / charsPerLine);
    const lines = Math.min(linesNeeded, maxLines);
    const textHeight = lines * size * lineHeightRatio;
    // Check if text fits: all chars visible within maxLines, and height fits
    if (linesNeeded <= maxLines && textHeight <= availHeight) return size;
  }
  return 0;
}
