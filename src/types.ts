export interface Point {
  x: number;
  y: number;
}

export interface FloorPlan {
  id: string;
  name: string;
  imageUrl: string;
  imagePath?: string | null;
  pixelsPerFoot: number | null;
  calibrationPoints: [Point, Point] | null;
  calibrationDistanceFt: number | null;
}

export type FurnitureShape = 'rect' | 'ellipse' | 'polygon';

export interface FurniturePreset {
  id: string;
  category: string;
  name: string;
  widthIn: number;   // inches
  depthIn: number;   // inches
  shape: FurnitureShape;
  vertices?: number[]; // flat array [x1,y1,x2,y2,...] for polygon shapes, normalized to 0-1 range
  color: string;
}

export interface PlacedFurniture {
  id: string;
  presetId: string | null; // null for custom polygons
  name: string;
  x: number;          // canvas px
  y: number;          // canvas px
  widthPx: number;    // canvas px (scaled from real dimensions)
  heightPx: number;   // canvas px
  rotation: number;   // degrees
  color: string;
  shape: FurnitureShape;
  vertices?: number[]; // for custom polygons, absolute canvas coords relative to item origin
  floorPlanId: string;
  locked: boolean;
}

export type ToolMode = 'select' | 'calibrate' | 'measure' | 'draw-polygon' | 'place' | 'export-select';

export interface ExportSelection {
  start: Point | null;
  rect: { x: number; y: number; width: number; height: number } | null;
}

export interface CalibrationState {
  points: Point[];
  isActive: boolean;
  detectedDimensions: DetectedDimension[];
  ocrProgress: number;
  ocrRunning: boolean;
}

export interface DetectedDimension {
  text: string;
  feet: number;
  inches: number;
  totalFeet: number;
}

export interface MeasureState {
  points: Point[];
  distanceFt: number | null;
}

export interface DrawPolygonState {
  vertices: Point[];
  isDrawing: boolean;
}

export interface AppState {
  floorPlans: FloorPlan[];
  activeFloorPlanId: string | null;
  furniture: PlacedFurniture[];
  selectedFurnitureId: string | null;
  toolMode: ToolMode;
  calibration: CalibrationState;
  measure: MeasureState;
  drawPolygon: DrawPolygonState;
  exportSelection: ExportSelection;
  showGrid: boolean;
  gridSizeIn: number; // grid cell size in inches (default 12 = 1ft)
  snapToGrid: boolean;
  placingPreset: FurniturePreset | null;
  stagePos: Point;
  stageScale: number;
}

export type AppAction =
  | { type: 'ADD_FLOOR_PLAN'; payload: FloorPlan }
  | { type: 'UPDATE_FLOOR_PLAN'; payload: { id: string; updates: Partial<FloorPlan> } }
  | { type: 'REMOVE_FLOOR_PLAN'; payload: string }
  | { type: 'SET_ACTIVE_FLOOR_PLAN'; payload: string }
  | { type: 'SET_CALIBRATION'; payload: { floorPlanId: string; pixelsPerFoot: number; points: [Point, Point]; distanceFt: number } }
  | { type: 'SET_TOOL_MODE'; payload: ToolMode }
  | { type: 'ADD_CALIBRATION_POINT'; payload: Point }
  | { type: 'RESET_CALIBRATION_POINTS' }
  | { type: 'SET_OCR_DIMENSIONS'; payload: DetectedDimension[] }
  | { type: 'SET_OCR_PROGRESS'; payload: number }
  | { type: 'SET_OCR_RUNNING'; payload: boolean }
  | { type: 'ADD_FURNITURE'; payload: PlacedFurniture }
  | { type: 'UPDATE_FURNITURE'; payload: { id: string; updates: Partial<PlacedFurniture> } }
  | { type: 'REMOVE_FURNITURE'; payload: string }
  | { type: 'SELECT_FURNITURE'; payload: string | null }
  | { type: 'SET_PLACING_PRESET'; payload: FurniturePreset | null }
  | { type: 'ADD_MEASURE_POINT'; payload: Point }
  | { type: 'RESET_MEASURE' }
  | { type: 'ADD_DRAW_VERTEX'; payload: Point }
  | { type: 'FINISH_DRAW_POLYGON' }
  | { type: 'CANCEL_DRAW_POLYGON' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'SET_STAGE_POS'; payload: Point }
  | { type: 'SET_STAGE_SCALE'; payload: number }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'DUPLICATE_FURNITURE'; payload: string }
  | { type: 'SET_EXPORT_SELECTION'; payload: ExportSelection }
  | { type: 'CLEAR_EXPORT_SELECTION' };
