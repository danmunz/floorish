import { useEffect, useRef, useCallback } from 'react';
import { useAppState } from './useAppState';
import { useAuth } from './useAuth';
import {
  updateProject,
  upsertFloorPlan,
  upsertFurniture,
  deleteFurniture,
  deleteFloorPlan,
} from '../lib/api';

const DEBOUNCE_MS = 800;

/**
 * Autosaves state changes to Supabase for authenticated users.
 * Does nothing in guest mode — the existing usePersistence hook handles localStorage.
 */
export function useCloudPersistence(projectId: string | null) {
  const { user, isGuest } = useAuth();
  const { state } = useAppState();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevStateRef = useRef(state);
  const savingRef = useRef(false);

  const saveToCloud = useCallback(async () => {
    if (!user || isGuest || !projectId || savingRef.current) return;
    savingRef.current = true;

    const prev = prevStateRef.current;
    const curr = state;

    try {
      // Sync project settings
      if (
        curr.showGrid !== prev.showGrid ||
        curr.gridSizeIn !== prev.gridSizeIn ||
        curr.snapToGrid !== prev.snapToGrid
      ) {
        await updateProject(projectId, {
          settings: {
            showGrid: curr.showGrid,
            gridSizeIn: curr.gridSizeIn,
            snapToGrid: curr.snapToGrid,
          },
        });
      }

      // Sync floor plans
      const currFpIds = new Set(curr.floorPlans.map((fp) => fp.id));
      const prevFpIds = new Set(prev.floorPlans.map((fp) => fp.id));

      // Upsert changed/new floor plans
      for (const fp of curr.floorPlans) {
        const prevFp = prev.floorPlans.find((p) => p.id === fp.id);
        if (!prevFp || prevFp !== fp) {
          await upsertFloorPlan({
            id: fp.id,
            project_id: projectId,
            name: fp.name,
            pixels_per_foot: fp.pixelsPerFoot,
            calibration_points: fp.calibrationPoints,
            calibration_distance_ft: fp.calibrationDistanceFt,
            sort_order: curr.floorPlans.indexOf(fp),
          });
        }
      }

      // Delete removed floor plans
      for (const id of prevFpIds) {
        if (!currFpIds.has(id)) {
          await deleteFloorPlan(id);
        }
      }

      // Sync furniture
      const currFurnIds = new Set(curr.furniture.map((f) => f.id));
      const prevFurnIds = new Set(prev.furniture.map((f) => f.id));

      // Upsert changed/new furniture
      for (const f of curr.furniture) {
        const prevF = prev.furniture.find((p) => p.id === f.id);
        if (!prevF || prevF !== f) {
          await upsertFurniture({
            id: f.id,
            floor_plan_id: f.floorPlanId,
            preset_id: f.presetId,
            name: f.name,
            x: f.x,
            y: f.y,
            width_px: f.widthPx,
            height_px: f.heightPx,
            rotation: f.rotation,
            color: f.color,
            shape: f.shape,
            vertices: f.vertices,
            locked: f.locked,
          });
        }
      }

      // Delete removed furniture
      for (const id of prevFurnIds) {
        if (!currFurnIds.has(id)) {
          await deleteFurniture(id);
        }
      }
    } catch (err) {
      console.error('Cloud save failed:', err);
    } finally {
      prevStateRef.current = curr;
      savingRef.current = false;
    }
  }, [user, isGuest, projectId, state]);

  // Debounced autosave on state changes
  useEffect(() => {
    if (!user || isGuest || !projectId) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveToCloud, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    state.furniture,
    state.floorPlans,
    state.showGrid,
    state.gridSizeIn,
    state.snapToGrid,
    saveToCloud,
    user,
    isGuest,
    projectId,
  ]);
}
