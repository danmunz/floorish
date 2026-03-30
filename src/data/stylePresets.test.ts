import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS, buildPrompt, QUALITY_SUFFIX } from './stylePresets';

describe('stylePresets', () => {
  it('has at least 5 presets', () => {
    expect(STYLE_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('each preset has required fields', () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.prompt).toBeTruthy();
      expect(preset.swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('preset IDs are unique', () => {
    const ids = STYLE_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildPrompt', () => {
  it('builds a prompt from a known preset', () => {
    const result = buildPrompt('japandi');
    expect(result).toContain('japandi');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('appends custom modifiers', () => {
    const result = buildPrompt('coastal', 'add a fireplace');
    expect(result).toContain('coastal');
    expect(result).toContain('add a fireplace');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('uses raw string as prompt when preset is unknown', () => {
    const result = buildPrompt('custom style prompt');
    expect(result).toContain('custom style prompt');
    expect(result).toContain(QUALITY_SUFFIX);
  });

  it('handles empty custom modifiers', () => {
    const result = buildPrompt('midcentury', '');
    expect(result).not.toContain(', ,');
  });
});
