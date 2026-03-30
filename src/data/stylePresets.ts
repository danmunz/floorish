// Style presets for room restyling

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  swatch: string; // CSS color for preview
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Warm walnut wood, neutral linen, wabi-sabi minimalism',
    prompt: 'japandi interior design, warm walnut wood, neutral linen, wabi-sabi, minimal, clean lines, natural materials',
    swatch: '#C4A882',
  },
  {
    id: 'midcentury',
    name: 'Mid-Century Modern',
    description: 'Teak furniture, mustard accents, geometric patterns',
    prompt: 'mid-century modern interior, teak furniture, mustard yellow accent, geometric patterns, retro modern',
    swatch: '#D4943A',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Exposed brick, steel and leather, Edison bulbs',
    prompt: 'industrial loft interior, exposed brick wall, steel and leather furniture, Edison bulbs, raw concrete',
    swatch: '#6B6B6B',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Whitewashed walls, rattan, ocean light, bleached wood',
    prompt: 'coastal modern interior, whitewashed walls, rattan furniture, ocean light, bleached wood, linen curtains',
    swatch: '#8FBBD4',
  },
  {
    id: 'transitional',
    name: 'Transitional',
    description: 'Neutral palette, mixed metals, upholstered pieces',
    prompt: 'transitional style interior, neutral color palette, mixed metals, upholstered furniture, elegant',
    swatch: '#B8AFA6',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light wood, white walls, cozy textiles, hygge',
    prompt: 'scandinavian interior design, light birch wood, white walls, cozy textiles, hygge, functional minimalism',
    swatch: '#E8DDD0',
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    description: 'Bold geometry, velvet, gold accents, jewel tones',
    prompt: 'art deco interior, bold geometric patterns, velvet upholstery, gold metallic accents, jewel tones, glamorous',
    swatch: '#1A3C34',
  },
  {
    id: 'farmhouse',
    name: 'Modern Farmhouse',
    description: 'Shiplap, warm neutrals, rustic wood, cozy',
    prompt: 'modern farmhouse interior, shiplap walls, warm neutral palette, rustic reclaimed wood, cozy, inviting',
    swatch: '#A6977A',
  },
];

export const QUALITY_SUFFIX =
  'architectural photography, natural light, professional interior design, 8k, photorealistic, high quality';

export const DEFAULT_NEGATIVE_PROMPT =
  'blurry, distorted, extra furniture, clutter, cartoon, painting, watermark, text, low quality, deformed';

export function buildPrompt(stylePresetId: string, customModifiers = ''): string {
  const preset = STYLE_PRESETS.find(p => p.id === stylePresetId);
  const base = preset?.prompt ?? stylePresetId;
  return [base, customModifiers, QUALITY_SUFFIX].filter(Boolean).join(', ');
}
