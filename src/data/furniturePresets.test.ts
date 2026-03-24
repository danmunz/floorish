import { describe, it, expect } from 'vitest';
import { furniturePresets, categories } from '../data/furniturePresets';

describe('furniturePresets', () => {
  it('contains a non-empty array of presets', () => {
    expect(furniturePresets.length).toBeGreaterThan(0);
  });

  it('every preset has required fields', () => {
    for (const preset of furniturePresets) {
      expect(preset.id).toBeTruthy();
      expect(preset.category).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.widthIn).toBeGreaterThan(0);
      expect(preset.depthIn).toBeGreaterThan(0);
      expect(['rect', 'ellipse', 'polygon']).toContain(preset.shape);
      expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('has unique preset ids', () => {
    const ids = furniturePresets.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('polygon presets have vertices', () => {
    const polygons = furniturePresets.filter(p => p.shape === 'polygon');
    for (const p of polygons) {
      expect(p.vertices).toBeDefined();
      expect(p.vertices!.length).toBeGreaterThanOrEqual(6); // at least 3 xy pairs
      expect(p.vertices!.length % 2).toBe(0); // even number (xy pairs)
    }
  });
});

describe('categories', () => {
  it('is derived from presets', () => {
    expect(categories.length).toBeGreaterThan(0);
    for (const cat of categories) {
      expect(furniturePresets.some(p => p.category === cat)).toBe(true);
    }
  });

  it('contains expected categories', () => {
    expect(categories).toContain('Seating');
    expect(categories).toContain('Tables');
    expect(categories).toContain('Beds');
  });
});
