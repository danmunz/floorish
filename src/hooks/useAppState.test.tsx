import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppState } from '../hooks/useAppState';
import type { ReactNode } from 'react';
import type { FloorPlan, PlacedFurniture, Room } from '../types';

function wrapper({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

function setup() {
  return renderHook(() => useAppState(), { wrapper });
}

const makeFloorPlan = (overrides?: Partial<FloorPlan>): FloorPlan => ({
  id: 'fp-1',
  name: 'Test Plan',
  imageUrl: 'test.png',
  pixelsPerFoot: null,
  calibrationPoints: null,
  calibrationDistanceFt: null,
  ...overrides,
});

const makeFurniture = (overrides?: Partial<PlacedFurniture>): PlacedFurniture => ({
  id: 'item-1',
  presetId: 'sofa-3seat',
  name: 'Test Sofa',
  x: 100,
  y: 200,
  widthPx: 84,
  heightPx: 36,
  rotation: 0,
  color: '#5B8C6B',
  shape: 'rect',
  floorPlanId: 'fp-1',
  locked: false,
  ...overrides,
});

describe('useAppState', () => {
  it('throws when used outside AppProvider', () => {
    expect(() => renderHook(() => useAppState())).toThrow(
      'useAppState must be used within AppProvider'
    );
  });

  it('provides initial state', () => {
    const { result } = setup();
    expect(result.current.state.floorPlans).toEqual([]);
    expect(result.current.state.furniture).toEqual([]);
    expect(result.current.state.toolMode).toBe('select');
    expect(result.current.state.showGrid).toBe(true);
    expect(result.current.state.snapToGrid).toBe(false);
  });
});

describe('floor plan actions', () => {
  it('ADD_FLOOR_PLAN adds and auto-activates first plan', () => {
    const { result } = setup();
    const fp = makeFloorPlan();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: fp }));

    expect(result.current.state.floorPlans).toHaveLength(1);
    expect(result.current.state.activeFloorPlanId).toBe('fp-1');
  });

  it('ADD_FLOOR_PLAN does not change active plan if one already exists', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-2' }) }));

    expect(result.current.state.activeFloorPlanId).toBe('fp-1');
    expect(result.current.state.floorPlans).toHaveLength(2);
  });

  it('REMOVE_FLOOR_PLAN removes plan and associated furniture', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan() }));
    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'REMOVE_FLOOR_PLAN', payload: 'fp-1' }));

    expect(result.current.state.floorPlans).toHaveLength(0);
    expect(result.current.state.furniture).toHaveLength(0);
    expect(result.current.state.activeFloorPlanId).toBeNull();
  });

  it('SET_ACTIVE_FLOOR_PLAN switches plan and resets selection', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-2' }) }));
    act(() => result.current.dispatch({ type: 'SET_ACTIVE_FLOOR_PLAN', payload: 'fp-2' }));

    expect(result.current.state.activeFloorPlanId).toBe('fp-2');
    expect(result.current.state.selectedFurnitureId).toBeNull();
  });

  it('RENAME_FLOOR_PLAN renames a floor plan', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan() }));
    act(() => result.current.dispatch({
      type: 'RENAME_FLOOR_PLAN',
      payload: { id: 'fp-1', name: 'Living Room' },
    }));

    const fp = result.current.state.floorPlans[0];
    expect(fp.name).toBe('Living Room');
    expect(fp.id).toBe('fp-1');
    expect(fp.imageUrl).toBe('test.png'); // unchanged
  });
});

describe('furniture actions', () => {
  it('ADD_FURNITURE adds and selects item', () => {
    const { result } = setup();
    const item = makeFurniture();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: item }));

    expect(result.current.state.furniture).toHaveLength(1);
    expect(result.current.state.selectedFurnitureId).toBe('item-1');
  });

  it('UPDATE_FURNITURE updates item properties', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({
      type: 'UPDATE_FURNITURE',
      payload: { id: 'item-1', updates: { x: 500, rotation: 90 } },
    }));

    const updated = result.current.state.furniture[0];
    expect(updated.x).toBe(500);
    expect(updated.rotation).toBe(90);
    expect(updated.y).toBe(200); // unchanged
  });

  it('REMOVE_FURNITURE removes item and clears selection', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'REMOVE_FURNITURE', payload: 'item-1' }));

    expect(result.current.state.furniture).toHaveLength(0);
    expect(result.current.state.selectedFurnitureId).toBeNull();
  });

  it('DUPLICATE_FURNITURE creates offset copy', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'DUPLICATE_FURNITURE', payload: 'item-1' }));

    expect(result.current.state.furniture).toHaveLength(2);
    const dup = result.current.state.furniture[1];
    expect(dup.id).not.toBe('item-1');
    expect(dup.x).toBe(120); // offset by 20
    expect(dup.y).toBe(220);
    expect(dup.name).toBe('Test Sofa');
    expect(result.current.state.selectedFurnitureId).toBe(dup.id);
  });

  it('DUPLICATE_FURNITURE does nothing for nonexistent id', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'DUPLICATE_FURNITURE', payload: 'nonexistent' }));

    expect(result.current.state.furniture).toHaveLength(1);
  });

  it('SELECT_FURNITURE sets selected id', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'SELECT_FURNITURE', payload: null }));

    expect(result.current.state.selectedFurnitureId).toBeNull();

    act(() => result.current.dispatch({ type: 'SELECT_FURNITURE', payload: 'item-1' }));

    expect(result.current.state.selectedFurnitureId).toBe('item-1');
  });
});

describe('tool mode actions', () => {
  it('SET_TOOL_MODE changes mode', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'measure' }));

    expect(result.current.state.toolMode).toBe('measure');
  });

  it('SET_TOOL_MODE to calibrate activates calibration', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'calibrate' }));

    expect(result.current.state.calibration.isActive).toBe(true);
    expect(result.current.state.calibration.points).toEqual([]);
  });

  it('SET_TOOL_MODE away from select clears furniture selection', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'measure' }));

    expect(result.current.state.selectedFurnitureId).toBeNull();
  });
});

describe('calibration actions', () => {
  it('ADD_CALIBRATION_POINT accumulates points', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'calibrate' }));
    act(() => result.current.dispatch({ type: 'ADD_CALIBRATION_POINT', payload: { x: 10, y: 20 } }));
    act(() => result.current.dispatch({ type: 'ADD_CALIBRATION_POINT', payload: { x: 110, y: 20 } }));

    expect(result.current.state.calibration.points).toHaveLength(2);
  });

  it('RESET_CALIBRATION_POINTS clears points', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_CALIBRATION_POINT', payload: { x: 10, y: 20 } }));
    act(() => result.current.dispatch({ type: 'RESET_CALIBRATION_POINTS' }));

    expect(result.current.state.calibration.points).toEqual([]);
  });

  it('SET_CALIBRATION saves ppf to floor plan', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan() }));
    act(() => result.current.dispatch({
      type: 'SET_CALIBRATION',
      payload: {
        floorPlanId: 'fp-1',
        pixelsPerFoot: 50,
        points: [{ x: 0, y: 0 }, { x: 500, y: 0 }],
        distanceFt: 10,
      },
    }));

    const fp = result.current.state.floorPlans[0];
    expect(fp.pixelsPerFoot).toBe(50);
    expect(fp.calibrationDistanceFt).toBe(10);
    expect(result.current.state.toolMode).toBe('select');
  });
});

describe('measure actions', () => {
  it('ADD_MEASURE_POINT accumulates up to 2 points', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 0, y: 0 } }));
    expect(result.current.state.measure.points).toHaveLength(1);

    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 100, y: 0 } }));
    expect(result.current.state.measure.points).toHaveLength(2);
  });

  it('ADD_MEASURE_POINT resets after 2 points', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 0, y: 0 } }));
    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 100, y: 0 } }));
    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 50, y: 50 } }));

    expect(result.current.state.measure.points).toHaveLength(1);
    expect(result.current.state.measure.points[0]).toEqual({ x: 50, y: 50 });
  });

  it('RESET_MEASURE clears measure state', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_MEASURE_POINT', payload: { x: 0, y: 0 } }));
    act(() => result.current.dispatch({ type: 'RESET_MEASURE' }));

    expect(result.current.state.measure.points).toEqual([]);
  });
});

describe('draw polygon actions', () => {
  it('ADD_DRAW_VERTEX accumulates vertices', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-polygon' }));
    act(() => result.current.dispatch({ type: 'ADD_DRAW_VERTEX', payload: { x: 0, y: 0 } }));
    act(() => result.current.dispatch({ type: 'ADD_DRAW_VERTEX', payload: { x: 100, y: 0 } }));

    expect(result.current.state.drawPolygon.vertices).toHaveLength(2);
    expect(result.current.state.drawPolygon.isDrawing).toBe(true);
  });

  it('FINISH_DRAW_POLYGON resets and returns to select', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-polygon' }));
    act(() => result.current.dispatch({ type: 'ADD_DRAW_VERTEX', payload: { x: 0, y: 0 } }));
    act(() => result.current.dispatch({ type: 'FINISH_DRAW_POLYGON' }));

    expect(result.current.state.drawPolygon.vertices).toEqual([]);
    expect(result.current.state.drawPolygon.isDrawing).toBe(false);
    expect(result.current.state.toolMode).toBe('select');
  });

  it('CANCEL_DRAW_POLYGON resets and returns to select', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-polygon' }));
    act(() => result.current.dispatch({ type: 'ADD_DRAW_VERTEX', payload: { x: 0, y: 0 } }));
    act(() => result.current.dispatch({ type: 'CANCEL_DRAW_POLYGON' }));

    expect(result.current.state.drawPolygon.vertices).toEqual([]);
    expect(result.current.state.toolMode).toBe('select');
  });
});

describe('toggle actions', () => {
  it('TOGGLE_GRID toggles grid', () => {
    const { result } = setup();

    expect(result.current.state.showGrid).toBe(true);
    act(() => result.current.dispatch({ type: 'TOGGLE_GRID' }));
    expect(result.current.state.showGrid).toBe(false);
    act(() => result.current.dispatch({ type: 'TOGGLE_GRID' }));
    expect(result.current.state.showGrid).toBe(true);
  });

  it('TOGGLE_SNAP toggles snap', () => {
    const { result } = setup();

    expect(result.current.state.snapToGrid).toBe(false);
    act(() => result.current.dispatch({ type: 'TOGGLE_SNAP' }));
    expect(result.current.state.snapToGrid).toBe(true);
  });

  it('SET_GRID_SIZE updates grid size', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_GRID_SIZE', payload: 24 }));
    expect(result.current.state.gridSizeIn).toBe(24);
  });
});

describe('stage actions', () => {
  it('SET_STAGE_POS updates position', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_STAGE_POS', payload: { x: 100, y: 200 } }));
    expect(result.current.state.stagePos).toEqual({ x: 100, y: 200 });
  });

  it('SET_STAGE_SCALE updates scale', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_STAGE_SCALE', payload: 2.5 }));
    expect(result.current.state.stageScale).toBe(2.5);
  });
});

describe('undo/redo', () => {
  it('can undo a furniture addition', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    expect(result.current.state.furniture).toHaveLength(1);

    act(() => result.current.undo());
    expect(result.current.state.furniture).toHaveLength(0);
  });

  it('can redo after undo', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    act(() => result.current.undo());
    act(() => result.current.redo());

    expect(result.current.state.furniture).toHaveLength(1);
  });

  it('reports canUndo/canRedo correctly', () => {
    const { result } = setup();

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture() }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('does not record ephemeral actions in history', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_STAGE_POS', payload: { x: 100, y: 100 } }));
    act(() => result.current.dispatch({ type: 'SET_STAGE_SCALE', payload: 2 }));
    act(() => result.current.dispatch({ type: 'SELECT_FURNITURE', payload: null }));

    expect(result.current.canUndo).toBe(false);
  });

  it('can undo a floor plan rename', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan() }));
    act(() => result.current.dispatch({
      type: 'RENAME_FLOOR_PLAN',
      payload: { id: 'fp-1', name: 'Kitchen' },
    }));
    expect(result.current.state.floorPlans[0].name).toBe('Kitchen');

    act(() => result.current.undo());
    expect(result.current.state.floorPlans[0].name).toBe('Test Plan');
  });

  it('clears future on new action after undo', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture({ id: 'a' }) }));
    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture({ id: 'b' }) }));
    act(() => result.current.undo());

    // Now dispatch a new action – future should be cleared
    act(() => result.current.dispatch({ type: 'ADD_FURNITURE', payload: makeFurniture({ id: 'c' }) }));
    expect(result.current.canRedo).toBe(false);
  });
});

const makeRoom = (overrides?: Partial<Room>): Room => ({
  id: 'room-1',
  name: 'Living Room',
  color: '#E8D4B8',
  vertices: [0, 0, 100, 0, 100, 100, 0, 100],
  x: 50,
  y: 50,
  widthPx: 100,
  heightPx: 100,
  floorPlanId: 'fp-1',
  ...overrides,
});

describe('room actions', () => {
  it('ADD_ROOM adds and selects room', () => {
    const { result } = setup();
    const room = makeRoom();

    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: room }));

    expect(result.current.state.rooms).toHaveLength(1);
    expect(result.current.state.rooms[0]).toEqual(room);
    expect(result.current.state.selectedRoomId).toBe('room-1');
  });

  it('UPDATE_ROOM updates an existing room by id', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom() }));
    act(() => result.current.dispatch({
      type: 'UPDATE_ROOM',
      payload: { id: 'room-1', updates: { name: 'Kitchen', color: '#FF0000' } },
    }));

    const updated = result.current.state.rooms[0];
    expect(updated.name).toBe('Kitchen');
    expect(updated.color).toBe('#FF0000');
    expect(updated.x).toBe(50); // unchanged
  });

  it('REMOVE_ROOM removes room and clears selectedRoomId if selected', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom() }));
    expect(result.current.state.selectedRoomId).toBe('room-1');

    act(() => result.current.dispatch({ type: 'REMOVE_ROOM', payload: 'room-1' }));

    expect(result.current.state.rooms).toHaveLength(0);
    expect(result.current.state.selectedRoomId).toBeNull();
  });

  it('REMOVE_ROOM preserves selectedRoomId when removing a different room', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-2' }) }));
    // room-2 is now selected (last added)
    act(() => result.current.dispatch({ type: 'REMOVE_ROOM', payload: 'room-1' }));

    expect(result.current.state.rooms).toHaveLength(1);
    expect(result.current.state.selectedRoomId).toBe('room-2');
  });

  it('SELECT_ROOM sets selectedRoomId', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom() }));
    act(() => result.current.dispatch({ type: 'SELECT_ROOM', payload: null }));

    expect(result.current.state.selectedRoomId).toBeNull();

    act(() => result.current.dispatch({ type: 'SELECT_ROOM', payload: 'room-1' }));

    expect(result.current.state.selectedRoomId).toBe('room-1');
  });

  it('SELECT_ROOM is ephemeral and does not affect undo history', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SELECT_ROOM', payload: 'room-1' }));

    expect(result.current.canUndo).toBe(false);
  });

  it('FINISH_DRAW_ROOM sets toolMode back to style', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-room' }));
    act(() => result.current.dispatch({ type: 'FINISH_DRAW_ROOM' }));

    expect(result.current.state.toolMode).toBe('style');
    expect(result.current.state.drawPolygon.vertices).toEqual([]);
    expect(result.current.state.drawPolygon.isDrawing).toBe(false);
  });
});

describe('room cascade delete', () => {
  it('REMOVE_FLOOR_PLAN removes rooms linked to that floorPlanId', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-1', floorPlanId: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-2', floorPlanId: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'REMOVE_FLOOR_PLAN', payload: 'fp-1' }));

    expect(result.current.state.rooms).toHaveLength(0);
    expect(result.current.state.selectedRoomId).toBeNull();
  });

  it('REMOVE_FLOOR_PLAN preserves rooms on other floor plans', () => {
    const { result } = setup();

    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_FLOOR_PLAN', payload: makeFloorPlan({ id: 'fp-2' }) }));
    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-1', floorPlanId: 'fp-1' }) }));
    act(() => result.current.dispatch({ type: 'ADD_ROOM', payload: makeRoom({ id: 'room-2', floorPlanId: 'fp-2' }) }));
    act(() => result.current.dispatch({ type: 'REMOVE_FLOOR_PLAN', payload: 'fp-1' }));

    expect(result.current.state.rooms).toHaveLength(1);
    expect(result.current.state.rooms[0].id).toBe('room-2');
  });
});

describe('LOAD_STATE', () => {
  it('merges partial state', () => {
    const { result } = setup();

    act(() => result.current.dispatch({
      type: 'LOAD_STATE',
      payload: { showGrid: false, gridSizeIn: 24 },
    }));

    expect(result.current.state.showGrid).toBe(false);
    expect(result.current.state.gridSizeIn).toBe(24);
    expect(result.current.state.toolMode).toBe('select'); // unchanged
  });

  it('loads rooms as part of LOAD_STATE', () => {
    const { result } = setup();
    const rooms = [makeRoom({ id: 'r1', name: 'Kitchen' }), makeRoom({ id: 'r2', name: 'Bedroom' })];

    act(() => result.current.dispatch({
      type: 'LOAD_STATE',
      payload: { rooms },
    }));

    expect(result.current.state.rooms).toHaveLength(2);
    expect(result.current.state.rooms[0].name).toBe('Kitchen');
    expect(result.current.state.rooms[1].name).toBe('Bedroom');
  });
});

describe('SET_PLACING_PRESET', () => {
  it('sets preset and switches to place mode', () => {
    const { result } = setup();
    const preset = { id: 'sofa-3seat', category: 'Seating', name: '3-Seat Sofa', widthIn: 84, depthIn: 36, shape: 'rect' as const, color: '#5B8C6B' };

    act(() => result.current.dispatch({ type: 'SET_PLACING_PRESET', payload: preset }));

    expect(result.current.state.placingPreset).toEqual(preset);
    expect(result.current.state.toolMode).toBe('place');
  });

  it('clears preset and returns to select', () => {
    const { result } = setup();
    const preset = { id: 'sofa-3seat', category: 'Seating', name: '3-Seat Sofa', widthIn: 84, depthIn: 36, shape: 'rect' as const, color: '#5B8C6B' };

    act(() => result.current.dispatch({ type: 'SET_PLACING_PRESET', payload: preset }));
    act(() => result.current.dispatch({ type: 'SET_PLACING_PRESET', payload: null }));

    expect(result.current.state.placingPreset).toBeNull();
    expect(result.current.state.toolMode).toBe('select');
  });
});
