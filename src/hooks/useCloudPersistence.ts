import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppState } from './useAppState';
import { useAuth } from './useAuth';
import type { AppState } from '../types';
import {
  updateProject,
  upsertFloorPlan,
  upsertFurniture,
  deleteFurniture,
  deleteFloorPlan,
} from '../lib/api';
import { upsertRoom, deleteRoom } from '../lib/roomApi';

const DEBOUNCE_MS = 800;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export type CloudSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface CloudSaveState {
  status: CloudSaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorStatus(error: unknown): number | null {
  if (!isObject(error) || typeof error.status !== 'number') return null;
  return error.status;
}

function getErrorCode(error: unknown): string {
  if (!isObject(error) || typeof error.code !== 'string') return '';
  return error.code;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isObject(error) && typeof error.message === 'string') return error.message;
  return 'Unknown autosave error';
}

function isTransientSaveError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 408 || status === 429 || (status !== null && status >= 500)) {
    return true;
  }

  const code = getErrorCode(error).toUpperCase();
  if (code.includes('ECONN') || code.includes('ETIMEDOUT') || code.includes('NETWORK')) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('temporarily') ||
    message.includes('429') ||
    message.includes('503')
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runWithRetry(task: () => Promise<void>): Promise<void> {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await task();
      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= MAX_RETRIES || !isTransientSaveError(error)) {
        throw error;
      }
      const delay = RETRY_BASE_MS * (2 ** (attempt - 1));
      await wait(delay);
    }
  }
}

function hasCloudRelevantChanges(prev: AppState, curr: AppState): boolean {
  if (
    curr.showGrid !== prev.showGrid ||
    curr.gridSizeIn !== prev.gridSizeIn ||
    curr.snapToGrid !== prev.snapToGrid
  ) {
    return true;
  }

  if (curr.floorPlans.length !== prev.floorPlans.length) return true;
  if (curr.furniture.length !== prev.furniture.length) return true;

  for (const floorPlan of curr.floorPlans) {
    const previousFloorPlan = prev.floorPlans.find((entry) => entry.id === floorPlan.id);
    if (!previousFloorPlan || previousFloorPlan !== floorPlan) {
      return true;
    }
  }

  for (const furniture of curr.furniture) {
    const previousFurniture = prev.furniture.find((entry) => entry.id === furniture.id);
    if (!previousFurniture || previousFurniture !== furniture) {
      return true;
    }
  }

  if (curr.rooms.length !== prev.rooms.length) return true;
  for (const room of curr.rooms) {
    const previousRoom = prev.rooms.find((entry) => entry.id === room.id);
    if (!previousRoom || previousRoom !== room) {
      return true;
    }
  }

  return false;
}

/**
 * Autosaves state changes to Supabase for authenticated users.
 * Does nothing in guest mode — the existing usePersistence hook handles localStorage.
 */
export function useCloudPersistence(projectId: string | null) {
  const { user, isGuest } = useAuth();
  const { state } = useAppState();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevStateRef = useRef(state);
  const latestStateRef = useRef(state);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const dirtyRef = useRef(false);
  const previousProjectIdRef = useRef<string | null>(projectId);
  const [saveState, setSaveState] = useState<CloudSaveState>({
    status: 'idle',
    lastSavedAt: null,
    errorMessage: null,
  });

  latestStateRef.current = state;

  const saveToCloud = useCallback(async () => {
    if (!user || isGuest || !projectId) return;

    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    savingRef.current = true;

    const prev = prevStateRef.current;
    const curr = latestStateRef.current;

    try {
      if (!hasCloudRelevantChanges(prev, curr)) {
        setSaveState((previous) => ({
          ...previous,
          status: previous.status === 'saved' ? 'saved' : 'idle',
          errorMessage: null,
        }));
        dirtyRef.current = false;
        return;
      }

      setSaveState((previous) => ({
        ...previous,
        status: 'saving',
        errorMessage: null,
      }));

      // Sync project settings
      if (
        curr.showGrid !== prev.showGrid ||
        curr.gridSizeIn !== prev.gridSizeIn ||
        curr.snapToGrid !== prev.snapToGrid
      ) {
        await runWithRetry(async () => {
          await updateProject(projectId, {
            settings: {
              showGrid: curr.showGrid,
              gridSizeIn: curr.gridSizeIn,
              snapToGrid: curr.snapToGrid,
            },
          });
        });
      }

      // Sync floor plans
      const currFpIds = new Set(curr.floorPlans.map((fp) => fp.id));
      const prevFpIds = new Set(prev.floorPlans.map((fp) => fp.id));

      // Upsert changed/new floor plans
      for (const fp of curr.floorPlans) {
        const prevFp = prev.floorPlans.find((p) => p.id === fp.id);
        if (!prevFp || prevFp !== fp) {
          await runWithRetry(async () => {
            await upsertFloorPlan({
              id: fp.id,
              project_id: projectId,
              name: fp.name,
              image_path: fp.imagePath ?? null,
              pixels_per_foot: fp.pixelsPerFoot,
              calibration_points: fp.calibrationPoints,
              calibration_distance_ft: fp.calibrationDistanceFt,
              sort_order: curr.floorPlans.indexOf(fp),
            });
          });
        }
      }

      // Delete removed floor plans
      for (const id of prevFpIds) {
        if (!currFpIds.has(id)) {
          await runWithRetry(async () => {
            await deleteFloorPlan(id);
          });
        }
      }

      // Sync furniture
      const currFurnIds = new Set(curr.furniture.map((f) => f.id));
      const prevFurnIds = new Set(prev.furniture.map((f) => f.id));

      // Upsert changed/new furniture
      for (const f of curr.furniture) {
        const prevF = prev.furniture.find((p) => p.id === f.id);
        if (!prevF || prevF !== f) {
          await runWithRetry(async () => {
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
          });
        }
      }

      // Delete removed furniture
      for (const id of prevFurnIds) {
        if (!currFurnIds.has(id)) {
          await runWithRetry(async () => {
            await deleteFurniture(id);
          });
        }
      }

      // Sync rooms
      const currRoomIds = new Set(curr.rooms.map((r) => r.id));
      const prevRoomIds = new Set(prev.rooms.map((r) => r.id));

      for (const room of curr.rooms) {
        const prevRoom = prev.rooms.find((r) => r.id === room.id);
        if (!prevRoom || prevRoom !== room) {
          await runWithRetry(async () => {
            await upsertRoom({
              id: room.id,
              floor_plan_id: room.floorPlanId,
              name: room.name,
              color: room.color,
              vertices: room.vertices,
              x: room.x,
              y: room.y,
              width_px: room.widthPx,
              height_px: room.heightPx,
              sort_order: curr.rooms.indexOf(room),
            });
          });
        }
      }

      for (const id of prevRoomIds) {
        if (!currRoomIds.has(id)) {
          await runWithRetry(async () => {
            await deleteRoom(id);
          });
        }
      }

      prevStateRef.current = curr;
      dirtyRef.current = false;
      setSaveState({
        status: 'saved',
        lastSavedAt: new Date(),
        errorMessage: null,
      });
    } catch (err) {
      console.error('Cloud save failed:', err);
      setSaveState((previous) => ({
        ...previous,
        status: 'error',
        errorMessage: getErrorMessage(err),
      }));
    } finally {
      savingRef.current = false;

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void saveToCloud();
      }
    }
  }, [user, isGuest, projectId]);

  // Handle project switches safely. We keep null -> id transitions untouched so a
  // newly-created project still receives the existing local draft on first sync.
  useEffect(() => {
    const previousProjectId = previousProjectIdRef.current;
    if (previousProjectId && projectId && previousProjectId !== projectId) {
      prevStateRef.current = latestStateRef.current;
      dirtyRef.current = false;
      pendingSaveRef.current = false;
      clearTimeout(timerRef.current);
      setSaveState({ status: 'idle', lastSavedAt: null, errorMessage: null });
    }

    if (!projectId) {
      pendingSaveRef.current = false;
      clearTimeout(timerRef.current);
      setSaveState({ status: 'idle', lastSavedAt: null, errorMessage: null });
    }

    previousProjectIdRef.current = projectId;
  }, [projectId]);

  // Debounced autosave on state changes
  useEffect(() => {
    if (!user || isGuest || !projectId) return;

    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveToCloud();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    state.furniture,
    state.floorPlans,
    state.rooms,
    state.showGrid,
    state.gridSizeIn,
    state.snapToGrid,
    saveToCloud,
    user,
    isGuest,
    projectId,
  ]);

  // Best-effort flush before tab close when there are unsynced changes.
  useEffect(() => {
    if (!user || isGuest || !projectId) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      clearTimeout(timerRef.current);
      void saveToCloud();
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, isGuest, projectId, saveToCloud]);

  // Flush immediately when the document is backgrounded.
  useEffect(() => {
    if (!user || isGuest || !projectId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || !dirtyRef.current) return;
      clearTimeout(timerRef.current);
      void saveToCloud();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isGuest, projectId, saveToCloud]);

  return saveState;
}
