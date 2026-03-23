import { describe, it, expect } from 'vitest';
import {
  parseDimensionText,
  pixelDistance,
  computePixelsPerFoot,
  inchesToPixels,
  pixelsToInches,
  pixelsToFeet,
  formatFeetInches,
  snapToGridValue,
  snapAngle,
  rectsOverlap,
} from '../utils/geometry';

describe('parseDimensionText', () => {
  it('parses single dimension like 14\'3"', () => {
    const results = parseDimensionText("14'3\"");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ text: "14'3\"", feet: 14, inches: 3, totalFeet: 14.25 });
  });

  it('parses dimension pairs like 14\'3" x 12\'', () => {
    const results = parseDimensionText("14'3\" x 12'");
    expect(results).toHaveLength(2);
    expect(results[0].feet).toBe(14);
    expect(results[0].inches).toBe(3);
    expect(results[1].feet).toBe(12);
    expect(results[1].inches).toBe(0);
  });

  it('parses alternate quote styles', () => {
    const results = parseDimensionText("21\u2032 x 20\u20326\u2033");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('filters out dimensions < 2 ft or > 50 ft', () => {
    const results = parseDimensionText("1'0\" and 55'0\"");
    expect(results).toHaveLength(0);
  });

  it('returns empty array for non-matching text', () => {
    expect(parseDimensionText('hello world')).toEqual([]);
  });

  it('deduplicates repeated dimensions', () => {
    const results = parseDimensionText("10' x 10'");
    // Should only appear once since both are the same
    expect(results.filter(r => r.feet === 10 && r.inches === 0)).toHaveLength(1);
  });
});

describe('pixelDistance', () => {
  it('computes horizontal distance', () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('computes vertical distance', () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('computes diagonal distance (3-4-5 triangle)', () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('returns 0 for same point', () => {
    expect(pixelDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });
});

describe('computePixelsPerFoot', () => {
  it('computes correct ppf', () => {
    const ppf = computePixelsPerFoot({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
    expect(ppf).toBe(10);
  });

  it('handles diagonal calibration', () => {
    const ppf = computePixelsPerFoot({ x: 0, y: 0 }, { x: 3, y: 4 }, 5);
    expect(ppf).toBe(1);
  });
});

describe('inchesToPixels', () => {
  it('converts 12 inches to 1 foot of pixels', () => {
    expect(inchesToPixels(12, 100)).toBe(100);
  });

  it('converts 6 inches', () => {
    expect(inchesToPixels(6, 100)).toBe(50);
  });

  it('converts 0 inches', () => {
    expect(inchesToPixels(0, 100)).toBe(0);
  });
});

describe('pixelsToInches', () => {
  it('converts pixels back to inches', () => {
    expect(pixelsToInches(100, 100)).toBe(12);
  });

  it('is the inverse of inchesToPixels', () => {
    const ppf = 50;
    const inches = 36;
    expect(pixelsToInches(inchesToPixels(inches, ppf), ppf)).toBeCloseTo(inches);
  });
});

describe('pixelsToFeet', () => {
  it('converts pixels to feet', () => {
    expect(pixelsToFeet(200, 100)).toBe(2);
  });

  it('handles fractional result', () => {
    expect(pixelsToFeet(150, 100)).toBe(1.5);
  });
});

describe('formatFeetInches', () => {
  it('formats whole feet', () => {
    expect(formatFeetInches(5)).toBe("5'");
  });

  it('formats feet and inches', () => {
    expect(formatFeetInches(5.5)).toBe("5'6\"");
  });

  it('rounds 12 inches up to next foot', () => {
    expect(formatFeetInches(4.99)).toBe("5'");
  });

  it('formats zero feet', () => {
    expect(formatFeetInches(0)).toBe("0'");
  });
});

describe('snapToGridValue', () => {
  it('snaps to nearest grid', () => {
    expect(snapToGridValue(14, 10)).toBe(10);
    expect(snapToGridValue(16, 10)).toBe(20);
  });

  it('snaps exact value to itself', () => {
    expect(snapToGridValue(20, 10)).toBe(20);
  });

  it('snaps midpoint', () => {
    expect(snapToGridValue(15, 10)).toBe(20);
  });
});

describe('snapAngle', () => {
  it('snaps to nearest increment', () => {
    expect(snapAngle(47, 15)).toBe(45);
    expect(snapAngle(53, 15)).toBe(60);
  });

  it('snaps exact multiples to themselves', () => {
    expect(snapAngle(90, 15)).toBe(90);
  });

  it('handles zero', () => {
    expect(snapAngle(0, 15)).toBe(0);
  });
});

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('detects non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('detects edge-touching rectangles as non-overlapping', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('detects containment', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 5, y: 5, width: 5, height: 5 };
    expect(rectsOverlap(a, b)).toBe(true);
  });
});
