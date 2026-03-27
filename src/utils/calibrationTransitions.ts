import type { FloorPlan } from '../types';

export function hasCalibrationTransition(
  previousFloorPlans: FloorPlan[],
  currentFloorPlans: FloorPlan[]
): boolean {
  const previousById = new Map(previousFloorPlans.map((floorPlan) => [floorPlan.id, floorPlan]));

  return currentFloorPlans.some((floorPlan) => {
    const previousFloorPlan = previousById.get(floorPlan.id);
    if (!previousFloorPlan) {
      return false;
    }

    return previousFloorPlan.pixelsPerFoot === null && floorPlan.pixelsPerFoot !== null;
  });
}
