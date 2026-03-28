import { supabase } from './supabase';
import type { FloorPlan, PlacedFurniture } from '../types';

// ── Projects ──

export interface Project {
  id: string;
  name: string;
  settings: {
    showGrid: boolean;
    gridSizeIn: number;
    snapToGrid: boolean;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const DEFAULT_PROJECT_SETTINGS = {
  showGrid: true,
  gridSizeIn: 12,
  snapToGrid: false,
};

function isPolicyRecursionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybePostgrest = error as { code?: string; message?: string };
  return maybePostgrest.code === '42P17'
    || /infinite recursion detected in policy/i.test(maybePostgrest.message ?? '');
}

export async function fetchProjects(options?: { includeDeleted?: boolean }): Promise<Project[]> {
  if (!supabase) return [];
  let query = supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (!options?.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;
  if (error) {
    if (isPolicyRecursionError(error)) {
      console.warn('Projects query blocked by recursive RLS policy; returning empty list until DB policies are fixed.');
      return [];
    }
    throw error;
  }
  return (data ?? []).map(rowToProject);
}

export async function ensureProfile(userId: string, meta?: Record<string, string>): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: userId,
    display_name: meta?.full_name ?? meta?.name ?? null,
    avatar_url: meta?.avatar_url ?? null,
  });

  if (insertError && insertError.code !== '23505') {
    // Ignore duplicate key race; another request may have inserted profile.
    throw insertError;
  }
}

export async function createProject(
  userId: string,
  name = 'Untitled Project',
  userMeta?: Record<string, string>
): Promise<Project> {
  if (!supabase) throw new Error('Supabase not configured');
  // Ensure profile exists (trigger may not have fired for pre-migration users)
  await ensureProfile(userId, userMeta);
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .insert({ id: projectId, user_id: userId, name });
  if (error) throw error;
  return {
    id: projectId,
    name,
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export async function updateProject(
  id: string,
  updates: { name?: string; settings?: object }
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);
  if (error) throw error;
}

export async function restoreProject(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) throw error;
}

function rowToProject(row: Record<string, unknown>): Project {
  const settings = (row.settings ?? {}) as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    settings: {
      showGrid: (settings.showGrid as boolean) ?? DEFAULT_PROJECT_SETTINGS.showGrid,
      gridSizeIn: (settings.gridSizeIn as number) ?? DEFAULT_PROJECT_SETTINGS.gridSizeIn,
      snapToGrid: (settings.snapToGrid as boolean) ?? DEFAULT_PROJECT_SETTINGS.snapToGrid,
    },
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: (row.deleted_at as string) ?? null,
  };
}

// ── Floor Plans ──

export async function fetchFloorPlans(projectId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertFloorPlan(
  fp: {
    id: string;
    project_id: string;
    name: string;
    image_path?: string | null;
    pixels_per_foot?: number | null;
    calibration_points?: unknown;
    calibration_distance_ft?: number | null;
    sort_order?: number;
  }
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('floor_plans')
    .upsert(fp, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteFloorPlan(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('floor_plans').delete().eq('id', id);
  if (error) throw error;
}

// ── Furniture ──

export async function fetchFurniture(floorPlanId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('furniture')
    .select('*')
    .eq('floor_plan_id', floorPlanId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertFurniture(
  item: {
    id: string;
    floor_plan_id: string;
    preset_id?: string | null;
    name: string;
    x: number;
    y: number;
    width_px: number;
    height_px: number;
    rotation?: number;
    color: string;
    shape: string;
    vertices?: unknown;
    locked?: boolean;
  }
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('furniture')
    .upsert(item, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteFurniture(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('furniture').delete().eq('id', id);
  if (error) throw error;
}

// ── Shares ──

export async function createShare(projectId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from('shares')
    .insert({ project_id: projectId, token });
  if (error) throw error;
  return token;
}

export async function fetchProjectByShareToken(token: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('shares')
    .select('project_id, expires_at, projects(*)')
    .eq('token', token)
    .single();
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  const sharedProject = data.projects as { deleted_at?: string | null } | null;
  if (sharedProject?.deleted_at) return null;
  return data;
}

// ── Converters: DB ↔ App State ──

export function dbFloorPlanToApp(
  row: Record<string, unknown>,
  imageUrl: string
): FloorPlan {
  return {
    id: row.id as string,
    name: row.name as string,
    imageUrl,
    imagePath: (row.image_path as string) ?? null,
    pixelsPerFoot: row.pixels_per_foot as number | null,
    calibrationPoints: row.calibration_points as [{ x: number; y: number }, { x: number; y: number }] | null,
    calibrationDistanceFt: row.calibration_distance_ft as number | null,
  };
}

export function dbFurnitureToApp(row: Record<string, unknown>): PlacedFurniture {
  return {
    id: row.id as string,
    presetId: (row.preset_id as string) ?? null,
    name: row.name as string,
    x: row.x as number,
    y: row.y as number,
    widthPx: row.width_px as number,
    heightPx: row.height_px as number,
    rotation: row.rotation as number,
    color: row.color as string,
    shape: row.shape as 'rect' | 'ellipse' | 'polygon',
    vertices: row.vertices as number[] | undefined,
    floorPlanId: row.floor_plan_id as string,
    locked: row.locked as boolean,
  };
}
