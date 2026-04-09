// Style presets for room restyling and virtual staging

export type StyleMode = 'stage' | 'restyle';

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  stagingPrompt: string;   // used in Stage mode (empty room → furnished)
  restylePrompt: string;   // used in Restyle mode (change existing aesthetic)
  swatch: string; // CSS color for preview
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Warm walnut wood, neutral linen, wabi-sabi minimalism',
    stagingPrompt: 'A beautifully furnished room in japandi style with a low walnut platform sofa, linen cushions, a round wooden coffee table, ceramic vases, wabi-sabi minimalism, clean lines, natural materials',
    restylePrompt: 'japandi interior design, warm walnut wood, neutral linen, wabi-sabi, minimal, clean lines, natural materials',
    swatch: '#C4A882',
  },
  {
    id: 'midcentury',
    name: 'Mid-Century Modern',
    description: 'Teak furniture, mustard accents, geometric patterns',
    stagingPrompt: 'A beautifully furnished room in mid-century modern style with a teak credenza, mustard yellow armchair, geometric patterned rug, Nelson bubble lamp, retro modern furniture, tapered legs',
    restylePrompt: 'mid-century modern interior, teak furniture, mustard yellow accent, geometric patterns, retro modern',
    swatch: '#D4943A',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Exposed brick, steel and leather, Edison bulbs',
    stagingPrompt: 'A beautifully furnished room in industrial style with a distressed leather sofa, metal and wood coffee table, wire pendant lights, exposed metal shelving, raw concrete accents',
    restylePrompt: 'industrial loft interior, exposed brick wall, steel and leather furniture, Edison bulbs, raw concrete',
    swatch: '#6B6B6B',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    description: 'Whitewashed walls, rattan, ocean light, bleached wood',
    stagingPrompt: 'A beautifully furnished room in coastal style with a white linen sofa, rattan accent chairs, driftwood coffee table, woven jute rug, potted palms, ocean-inspired decor',
    restylePrompt: 'coastal modern interior, whitewashed walls, rattan furniture, ocean light, bleached wood, linen curtains',
    swatch: '#8FBBD4',
  },
  {
    id: 'transitional',
    name: 'Transitional',
    description: 'Neutral palette, mixed metals, upholstered pieces',
    stagingPrompt: 'A beautifully furnished room in transitional style with an upholstered sofa in neutral tones, mixed metal side tables, elegant area rug, table lamps with linen shades, tasteful artwork',
    restylePrompt: 'transitional style interior, neutral color palette, mixed metals, upholstered furniture, elegant',
    swatch: '#B8AFA6',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Light wood, white walls, cozy textiles, hygge',
    stagingPrompt: 'A beautifully furnished room in scandinavian style with a light birch wood sofa frame, sheepskin throw, minimal white coffee table, pendant lamp, cozy knit textiles, potted plants',
    restylePrompt: 'scandinavian interior design, light birch wood, white walls, cozy textiles, hygge, functional minimalism',
    swatch: '#E8DDD0',
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    description: 'Bold geometry, velvet, gold accents, jewel tones',
    stagingPrompt: 'A beautifully furnished room in art deco style with a velvet emerald sofa, gold metallic side tables, geometric patterned rug, mirrored console, glamorous chandelier, jewel tones',
    restylePrompt: 'art deco interior, bold geometric patterns, velvet upholstery, gold metallic accents, jewel tones, glamorous',
    swatch: '#1A3C34',
  },
  {
    id: 'farmhouse',
    name: 'Modern Farmhouse',
    description: 'Shiplap, warm neutrals, rustic wood, cozy',
    stagingPrompt: 'A beautifully furnished room in modern farmhouse style with a deep linen sofa, reclaimed wood coffee table, woven baskets, iron lantern, cozy throw blankets, warm neutral palette',
    restylePrompt: 'modern farmhouse interior, shiplap walls, warm neutral palette, rustic reclaimed wood, cozy, inviting',
    swatch: '#A6977A',
  },
];

export const QUALITY_SUFFIX =
  'architectural photography, natural light, professional interior design, 8k, photorealistic, high quality';

export const DEFAULT_NEGATIVE_PROMPT =
  'blurry, distorted, extra furniture, clutter, cartoon, painting, watermark, text, low quality, deformed';

export const STAGING_NEGATIVE_PROMPT =
  'blurry, distorted, cartoon, painting, watermark, text, low quality, deformed, empty room, unfurnished';

export function buildPrompt(stylePresetId: string, mode: StyleMode = 'restyle', customModifiers = ''): string {
  const preset = STYLE_PRESETS.find(p => p.id === stylePresetId);
  const base = mode === 'stage'
    ? (preset?.stagingPrompt ?? stylePresetId)
    : (preset?.restylePrompt ?? stylePresetId);
  return [base, customModifiers, QUALITY_SUFFIX].filter(Boolean).join(', ');
}

export function getNegativePrompt(mode: StyleMode): string {
  return mode === 'stage' ? STAGING_NEGATIVE_PROMPT : DEFAULT_NEGATIVE_PROMPT;
}
