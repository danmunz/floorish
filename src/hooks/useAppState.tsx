import { createContext, useContext, useReducer, useCallback, useRef, type ReactNode } from 'react';
import type { AppState, AppAction, PlacedFurniture } from '../types';
import { v4 as uuid } from 'uuid';

const INITIAL_STATE: AppState = {
  floorPlans: [],
  activeFloorPlanId: null,
  furniture: [],
  selectedFurnitureId: null,
  toolMode: 'select',
  calibration: { points: [], isActive: false, detectedDimensions: [], ocrProgress: 0, ocrRunning: false },
  measure: { points: [], distanceFt: null },
  drawPolygon: { vertices: [], isDrawing: false },
  showGrid: true,
  gridSizeIn: 12,
  snapToGrid: false,
  placingPreset: null,
  stagePos: { x: 0, y: 0 },
  stageScale: 1,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FLOOR_PLAN':
      return {
        ...state,
        floorPlans: [...state.floorPlans, action.payload],
        activeFloorPlanId: state.activeFloorPlanId ?? action.payload.id,
      };
    case 'UPDATE_FLOOR_PLAN':
      return {
        ...state,
        floorPlans: state.floorPlans.map(fp =>
          fp.id === action.payload.id ? { ...fp, ...action.payload.updates } : fp
        ),
      };
    case 'REMOVE_FLOOR_PLAN':
      return {
        ...state,
        floorPlans: state.floorPlans.filter(fp => fp.id !== action.payload),
        activeFloorPlanId: state.activeFloorPlanId === action.payload
          ? (state.floorPlans.find(fp => fp.id !== action.payload)?.id ?? null)
          : state.activeFloorPlanId,
        furniture: state.furniture.filter(f => f.floorPlanId !== action.payload),
      };
    case 'SET_ACTIVE_FLOOR_PLAN':
      return {
        ...state,
        activeFloorPlanId: action.payload,
        selectedFurnitureId: null,
        calibration: { ...INITIAL_STATE.calibration },
        measure: { ...INITIAL_STATE.measure },
        drawPolygon: { ...INITIAL_STATE.drawPolygon },
      };
    case 'SET_CALIBRATION': {
      const fps = state.floorPlans.map(fp =>
        fp.id === action.payload.floorPlanId
          ? { ...fp, pixelsPerFoot: action.payload.pixelsPerFoot, calibrationPoints: action.payload.points, calibrationDistanceFt: action.payload.distanceFt }
          : fp
      );
      return {
        ...state,
        floorPlans: fps,
        calibration: { ...state.calibration, points: [], isActive: false },
        toolMode: 'select',
      };
    }
    case 'SET_TOOL_MODE':
      return {
        ...state,
        toolMode: action.payload,
        selectedFurnitureId: action.payload !== 'select' ? null : state.selectedFurnitureId,
        calibration: action.payload === 'calibrate'
          ? { ...state.calibration, points: [], isActive: true }
          : state.calibration,
        measure: action.payload === 'measure'
          ? { points: [], distanceFt: null }
          : state.measure,
        drawPolygon: action.payload === 'draw-polygon'
          ? { vertices: [], isDrawing: true }
          : state.drawPolygon,
        placingPreset: action.payload !== 'place' ? null : state.placingPreset,
      };
    case 'ADD_CALIBRATION_POINT':
      return {
        ...state,
        calibration: { ...state.calibration, points: [...state.calibration.points, action.payload] },
      };
    case 'RESET_CALIBRATION_POINTS':
      return {
        ...state,
        calibration: { ...state.calibration, points: [] },
      };
    case 'SET_OCR_DIMENSIONS':
      return {
        ...state,
        calibration: { ...state.calibration, detectedDimensions: action.payload },
      };
    case 'SET_OCR_PROGRESS':
      return {
        ...state,
        calibration: { ...state.calibration, ocrProgress: action.payload },
      };
    case 'SET_OCR_RUNNING':
      return {
        ...state,
        calibration: { ...state.calibration, ocrRunning: action.payload },
      };
    case 'ADD_FURNITURE':
      return {
        ...state,
        furniture: [...state.furniture, action.payload],
        selectedFurnitureId: action.payload.id,
      };
    case 'UPDATE_FURNITURE':
      return {
        ...state,
        furniture: state.furniture.map(f =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };
    case 'REMOVE_FURNITURE':
      return {
        ...state,
        furniture: state.furniture.filter(f => f.id !== action.payload),
        selectedFurnitureId: state.selectedFurnitureId === action.payload ? null : state.selectedFurnitureId,
      };
    case 'SELECT_FURNITURE':
      return { ...state, selectedFurnitureId: action.payload };
    case 'SET_PLACING_PRESET':
      return {
        ...state,
        placingPreset: action.payload,
        toolMode: action.payload ? 'place' : 'select',
        selectedFurnitureId: null,
      };
    case 'ADD_MEASURE_POINT': {
      const pts = state.measure.points.length >= 2
        ? [action.payload]
        : [...state.measure.points, action.payload];
      return { ...state, measure: { points: pts, distanceFt: null } };
    }
    case 'RESET_MEASURE':
      return { ...state, measure: { points: [], distanceFt: null } };
    case 'ADD_DRAW_VERTEX':
      return {
        ...state,
        drawPolygon: { ...state.drawPolygon, vertices: [...state.drawPolygon.vertices, action.payload] },
      };
    case 'FINISH_DRAW_POLYGON':
      return {
        ...state,
        drawPolygon: { vertices: [], isDrawing: false },
        toolMode: 'select',
      };
    case 'CANCEL_DRAW_POLYGON':
      return {
        ...state,
        drawPolygon: { vertices: [], isDrawing: false },
        toolMode: 'select',
      };
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };
    case 'SET_GRID_SIZE':
      return { ...state, gridSizeIn: action.payload };
    case 'TOGGLE_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };
    case 'SET_STAGE_POS':
      return { ...state, stagePos: action.payload };
    case 'SET_STAGE_SCALE':
      return { ...state, stageScale: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'DUPLICATE_FURNITURE': {
      const src = state.furniture.find(f => f.id === action.payload);
      if (!src) return state;
      const dup: PlacedFurniture = { ...src, id: uuid(), x: src.x + 20, y: src.y + 20 };
      return {
        ...state,
        furniture: [...state.furniture, dup],
        selectedFurnitureId: dup.id,
      };
    }
    default:
      return state;
  }
}

// ── Undo / Redo ──
const MAX_HISTORY = 50;

interface UndoableState {
  state: AppState;
  history: AppState[];
  future: AppState[];
}

type UndoAction =
  | { type: 'DISPATCH'; action: AppAction }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// Actions that should NOT be recorded in undo history (ephemeral updates)
const EPHEMERAL_ACTIONS = new Set([
  'SET_STAGE_POS', 'SET_STAGE_SCALE', 'SET_OCR_PROGRESS', 'SET_OCR_RUNNING',
  'SET_OCR_DIMENSIONS', 'ADD_CALIBRATION_POINT', 'ADD_MEASURE_POINT', 'ADD_DRAW_VERTEX',
  'SELECT_FURNITURE', 'SET_TOOL_MODE', 'SET_PLACING_PRESET', 'RESET_MEASURE',
  'RESET_CALIBRATION_POINTS', 'UPDATE_FLOOR_PLAN',
]);

function undoReducer(undoState: UndoableState, action: UndoAction): UndoableState {
  switch (action.type) {
    case 'DISPATCH': {
      const newState = appReducer(undoState.state, action.action);
      if (EPHEMERAL_ACTIONS.has(action.action.type)) {
        return { ...undoState, state: newState };
      }
      return {
        state: newState,
        history: [...undoState.history.slice(-(MAX_HISTORY - 1)), undoState.state],
        future: [],
      };
    }
    case 'UNDO': {
      if (undoState.history.length === 0) return undoState;
      const prev = undoState.history[undoState.history.length - 1];
      return {
        state: prev,
        history: undoState.history.slice(0, -1),
        future: [undoState.state, ...undoState.future],
      };
    }
    case 'REDO': {
      if (undoState.future.length === 0) return undoState;
      const next = undoState.future[0];
      return {
        state: next,
        history: [...undoState.history, undoState.state],
        future: undoState.future.slice(1),
      };
    }
  }
}

// ── Context ──
interface AppContextValue {
  state: AppState;
  dispatch: (action: AppAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [undoState, undoDispatch] = useReducer(undoReducer, {
    state: INITIAL_STATE,
    history: [],
    future: [],
  });

  const stateRef = useRef(undoState.state);
  stateRef.current = undoState.state;

  const dispatch = useCallback((action: AppAction) => {
    undoDispatch({ type: 'DISPATCH', action });
  }, []);

  const undo = useCallback(() => undoDispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => undoDispatch({ type: 'REDO' }), []);

  return (
    <AppContext.Provider
      value={{
        state: undoState.state,
        dispatch,
        undo,
        redo,
        canUndo: undoState.history.length > 0,
        canRedo: undoState.future.length > 0,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
