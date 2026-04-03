import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FurniturePalette } from './FurniturePalette';
import { useAppState } from '../hooks/useAppState';
import { furniturePresets } from '../data/furniturePresets';
import type { AppState } from '../types';

vi.mock('../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

const mockedUseAppState = vi.mocked(useAppState);

function createBaseState(overrides: Partial<AppState> = {}): AppState {
  return {
    floorPlans: [{
      id: 'fp-1',
      name: 'Test Plan',
      imageUrl: 'test.png',
      pixelsPerFoot: 24,
      calibrationPoints: null,
      calibrationDistanceFt: null,
    }],
    activeFloorPlanId: 'fp-1',
    furniture: [],
    selectedFurnitureId: null,
    toolMode: 'select',
    calibration: { points: [], isActive: false, detectedDimensions: [], ocrProgress: 0, ocrRunning: false },
    measure: { points: [], distanceFt: null },
    drawPolygon: { vertices: [], isDrawing: false },
    exportSelection: { start: null, rect: null },
    showGrid: true,
    gridSizeIn: 12,
    snapToGrid: false,
    placingPreset: null,
    stagePos: { x: 0, y: 0 },
    stageScale: 1,
    ...overrides,
  };
}

describe('FurniturePalette', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Done in placement mode and allows preset switching', () => {
    mockedUseAppState.mockReturnValue({
      state: createBaseState({ toolMode: 'place', placingPreset: furniturePresets[0] }),
      dispatch,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    });

    render(<FurniturePalette />);

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Loveseat/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_PLACING_PRESET',
      payload: expect.objectContaining({ id: 'sofa-2seat', name: 'Loveseat' }),
    });
  });

  it('selects all custom dimensions on focus', () => {
    mockedUseAppState.mockReturnValue({
      state: createBaseState(),
      dispatch,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    });

    render(<FurniturePalette />);
    fireEvent.click(screen.getByRole('button', { name: /3-Seat Sofa/i }));

    const [widthInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const selectSpy = vi.spyOn(widthInput, 'select');

    fireEvent.focus(widthInput);

    expect(selectSpy).toHaveBeenCalled();
  });
});
