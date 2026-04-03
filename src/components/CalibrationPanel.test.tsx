import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CalibrationPanel } from './CalibrationPanel';
import { useAppState } from '../hooks/useAppState';

vi.mock('../hooks/useAppState', () => ({
  useAppState: vi.fn(),
}));

vi.mock('../hooks/useOCR', () => ({
  useOCR: () => ({ runOCR: vi.fn() }),
}));

const mockedUseAppState = vi.mocked(useAppState);

describe('CalibrationPanel', () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAppState.mockReturnValue({
      state: {
        floorPlans: [],
        activeFloorPlanId: null,
        furniture: [],
        selectedFurnitureId: null,
        toolMode: 'calibrate',
        calibration: {
          points: [{ x: 0, y: 0 }, { x: 120, y: 0 }],
          isActive: true,
          detectedDimensions: [],
          ocrProgress: 0,
          ocrRunning: false,
        },
        measure: { points: [], distanceFt: null },
        drawPolygon: { vertices: [], isDrawing: false },
        exportSelection: { start: null, rect: null },
        showGrid: true,
        gridSizeIn: 12,
        snapToGrid: false,
        placingPreset: null,
        stagePos: { x: 0, y: 0 },
        stageScale: 1,
      },
      dispatch,
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    });
  });

  it('selects calibration inputs on focus', () => {
    render(<CalibrationPanel />);

    const [feetInput, inchesInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    const feetSelectSpy = vi.spyOn(feetInput, 'select');
    const inchesSelectSpy = vi.spyOn(inchesInput, 'select');

    fireEvent.focus(feetInput);
    fireEvent.focus(inchesInput);

    expect(feetSelectSpy).toHaveBeenCalled();
    expect(inchesSelectSpy).toHaveBeenCalled();
  });

  it('preserves entered value when focus and blur happen without edits', () => {
    render(<CalibrationPanel />);

    const [feetInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[];

    fireEvent.change(feetInput, { target: { value: '10' } });
    fireEvent.focus(feetInput);
    fireEvent.blur(feetInput);

    expect(feetInput).toHaveValue(10);
  });
});
