import type { FurniturePreset } from '../types';

const COLORS = {
  seating: '#5B8C6B',
  table: '#8B6B4A',
  bed: '#6B7B9E',
  storage: '#9E7B6B',
  appliance: '#7B7B7B',
  bathroom: '#6B9E9E',
  misc: '#9E6B8B',
};

export const furniturePresets: FurniturePreset[] = [
  // ── Seating ──
  { id: 'sofa-3seat',  category: 'Seating', name: '3-Seat Sofa',      widthIn: 84,  depthIn: 36,  shape: 'rect', color: COLORS.seating },
  { id: 'sofa-2seat',  category: 'Seating', name: 'Loveseat',         widthIn: 60,  depthIn: 34,  shape: 'rect', color: COLORS.seating },
  { id: 'sectional-l', category: 'Seating', name: 'L-Sectional',      widthIn: 112, depthIn: 84,  shape: 'polygon', color: COLORS.seating,
    vertices: [0, 0, 1, 0, 1, 0.43, 0.5, 0.43, 0.5, 1, 0, 1] },
  { id: 'armchair',    category: 'Seating', name: 'Armchair',          widthIn: 34,  depthIn: 34,  shape: 'rect', color: COLORS.seating },
  { id: 'recliner',    category: 'Seating', name: 'Recliner',          widthIn: 36,  depthIn: 38,  shape: 'rect', color: COLORS.seating },
  { id: 'dining-chair',category: 'Seating', name: 'Dining Chair',      widthIn: 18,  depthIn: 20,  shape: 'rect', color: COLORS.seating },
  { id: 'office-chair',category: 'Seating', name: 'Office Chair',      widthIn: 24,  depthIn: 24,  shape: 'rect', color: COLORS.seating },

  // ── Tables ──
  { id: 'dining-rect', category: 'Tables',  name: 'Dining Table (Rect)', widthIn: 72, depthIn: 36,  shape: 'rect', color: COLORS.table },
  { id: 'dining-round',category: 'Tables',  name: 'Dining Table (Round)',widthIn: 48, depthIn: 48,  shape: 'rect', color: COLORS.table },
  { id: 'coffee-table',category: 'Tables',  name: 'Coffee Table',       widthIn: 48,  depthIn: 24,  shape: 'rect', color: COLORS.table },
  { id: 'side-table',  category: 'Tables',  name: 'Side Table',         widthIn: 22,  depthIn: 22,  shape: 'rect', color: COLORS.table },
  { id: 'console',     category: 'Tables',  name: 'Console Table',      widthIn: 48,  depthIn: 16,  shape: 'rect', color: COLORS.table },
  { id: 'desk',        category: 'Tables',  name: 'Desk',               widthIn: 60,  depthIn: 30,  shape: 'rect', color: COLORS.table },

  // ── Beds ──
  { id: 'bed-king',    category: 'Beds',    name: 'King Bed',           widthIn: 76,  depthIn: 80,  shape: 'rect', color: COLORS.bed },
  { id: 'bed-queen',   category: 'Beds',    name: 'Queen Bed',          widthIn: 60,  depthIn: 80,  shape: 'rect', color: COLORS.bed },
  { id: 'bed-full',    category: 'Beds',    name: 'Full Bed',           widthIn: 54,  depthIn: 75,  shape: 'rect', color: COLORS.bed },
  { id: 'bed-twin',    category: 'Beds',    name: 'Twin Bed',           widthIn: 38,  depthIn: 75,  shape: 'rect', color: COLORS.bed },
  { id: 'crib',        category: 'Beds',    name: 'Crib',               widthIn: 28,  depthIn: 52,  shape: 'rect', color: COLORS.bed },
  { id: 'nightstand',  category: 'Beds',    name: 'Nightstand',         widthIn: 24,  depthIn: 16,  shape: 'rect', color: COLORS.bed },

  // ── Storage ──
  { id: 'bookshelf',   category: 'Storage', name: 'Bookshelf',          widthIn: 36,  depthIn: 12,  shape: 'rect', color: COLORS.storage },
  { id: 'dresser',     category: 'Storage', name: 'Dresser',            widthIn: 60,  depthIn: 18,  shape: 'rect', color: COLORS.storage },
  { id: 'tv-stand',    category: 'Storage', name: 'TV Stand',           widthIn: 60,  depthIn: 18,  shape: 'rect', color: COLORS.storage },
  { id: 'wardrobe',    category: 'Storage', name: 'Wardrobe',           widthIn: 48,  depthIn: 24,  shape: 'rect', color: COLORS.storage },
  { id: 'filing-cab',  category: 'Storage', name: 'Filing Cabinet',     widthIn: 18,  depthIn: 24,  shape: 'rect', color: COLORS.storage },

  // ── Appliances ──
  { id: 'fridge',      category: 'Appliances', name: 'Refrigerator',    widthIn: 36,  depthIn: 30,  shape: 'rect', color: COLORS.appliance },
  { id: 'stove',       category: 'Appliances', name: 'Stove/Oven',      widthIn: 30,  depthIn: 26,  shape: 'rect', color: COLORS.appliance },
  { id: 'dishwasher',  category: 'Appliances', name: 'Dishwasher',      widthIn: 24,  depthIn: 24,  shape: 'rect', color: COLORS.appliance },
  { id: 'washer',      category: 'Appliances', name: 'Washer',           widthIn: 27,  depthIn: 28,  shape: 'rect', color: COLORS.appliance },
  { id: 'dryer',       category: 'Appliances', name: 'Dryer',            widthIn: 27,  depthIn: 28,  shape: 'rect', color: COLORS.appliance },

  // ── Bathroom ──
  { id: 'bathtub',     category: 'Bathroom', name: 'Bathtub',           widthIn: 60,  depthIn: 30,  shape: 'rect', color: COLORS.bathroom },
  { id: 'shower',      category: 'Bathroom', name: 'Shower Stall',      widthIn: 36,  depthIn: 36,  shape: 'rect', color: COLORS.bathroom },
  { id: 'vanity',      category: 'Bathroom', name: 'Vanity',             widthIn: 48,  depthIn: 22,  shape: 'rect', color: COLORS.bathroom },
  { id: 'toilet',      category: 'Bathroom', name: 'Toilet',             widthIn: 18,  depthIn: 28,  shape: 'rect', color: COLORS.bathroom },

  // ── Misc ──
  { id: 'piano-upright',category: 'Misc',   name: 'Upright Piano',      widthIn: 58,  depthIn: 24,  shape: 'rect', color: COLORS.misc },
  { id: 'piano-grand', category: 'Misc',    name: 'Baby Grand Piano',   widthIn: 58,  depthIn: 66,  shape: 'rect', color: COLORS.misc },
  { id: 'rug-5x8',     category: 'Misc',    name: 'Area Rug 5×8',       widthIn: 60,  depthIn: 96,  shape: 'rect', color: COLORS.misc },
  { id: 'rug-8x10',    category: 'Misc',    name: 'Area Rug 8×10',      widthIn: 96,  depthIn: 120, shape: 'rect', color: COLORS.misc },
];

export const categories = [...new Set(furniturePresets.map(p => p.category))];
