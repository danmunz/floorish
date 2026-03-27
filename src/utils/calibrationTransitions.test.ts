import { describe, expect, it } from 'vitest';
import { hasCalibrationTransition } from './calibrationTransitions';
import type { FloorPlan } from '../types';

function makeFloorPlan(overrides?: Partial<FloorPlan>): FloorPlan {
  return {
    id: 'fp-1',
    name: 'Plan',
    imageUrl: '',
    pixelsPerFoot: null,
    calibrationPoints: null,
    calibrationDistanceFt: null,
    ...overrides,
  };
}

describe('hasCalibrationTransition', () => {
  it('returns true when an existing floor plan transitions from uncalibrated to calibrated', () => {
    const previous = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: null })];
    const current = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: 40 })];

    expect(hasCalibrationTransition(previous, current)).toBe(true);
  });

  it('returns false when there is no calibration change', () => {
    const previous = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: null })];
    const current = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: null })];

    expect(hasCalibrationTransition(previous, current)).toBe(false);
  });

  it('returns false when a pre-calibrated floor plan is newly loaded', () => {
    const previous: FloorPlan[] = [];
    const current = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: 55 })];

    expect(hasCalibrationTransition(previous, current)).toBe(false);
  });

  it('returns false when a floor plan stays calibrated', () => {
    const previous = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: 30 })];
    const current = [makeFloorPlan({ id: 'fp-1', pixelsPerFoot: 45 })];

    expect(hasCalibrationTransition(previous, current)).toBe(false);
  });
});
