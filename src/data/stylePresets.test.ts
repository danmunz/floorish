import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS, buildPrompt, QUALITY_SUFFIX, getNegativePrompt } from './stylePresets';

describe('stylePresets', () => {
  it('has at least 5 presets', () => {
    expect(STYLE_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('each preset has required fields', () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.stagingPrompt).toBeTruthy();
      expect(preset.restylePrompt).toBeTruthy();
      expect(preset.swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('preset IDs are unique', () => {
    const ids = STYLE_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildPrompt', () => {
  it('builds a staging prompt from a known preset', () => {
    const result = buildPrompt('japandi', 'stage');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('builds a restyle prompt from a known preset', () => {
    const result = buildPrompt('japandi', 'restyle');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('appends custom modifiers', () => {
    const result = buildPrompt('coastal', 'stage', 'add a fireplace');
    expect(result).toContain('add a fireplace');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('uses raw string as prompt when preset is unknown', () => {
    const result = buildPrompt('custom style prompt', 'stage');
    expect(result).toContain('custom style prompt');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('handles empty custom modifiers', () => {
    const result = buildPrompt('midcentury', 'restyle', '');
    expect(result).not.toContain(', ,');
  });
});

describe('getNegativePrompt', () => {
  it('returns a negative prompt for both modes', () => {
    expect(getNegativePrompt('stage')).toBeTruthy();
    expect(getNegativePrompt('restyle')).toBeTruthy();
  });
});
