import { supabase } from './supabase';
import type { Room } from '../types';

export interface RoomRow {
  id: string;
  floor_plan_id: string;
  name: string;
  color: string;
  vertices: number[];
  x: number;
  y: number;
  width_px: number;
  height_px: number;
  sort_order: number;
  created_at: string;
}

export async function fetchRooms(floorPlanId: string): Promise<RoomRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('floor_plan_id', floorPlanId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as RoomRow[];
}

export async function upsertRoom(room: {
  id: string;
  floor_plan_id: string;
  name: string;
  color: string;
  vertices: number[];
  x: number;
  y: number;
  width_px: number;
  height_px: number;
  sort_order?: number;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('rooms')
    .upsert(room, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteRoom(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw error;
}

export function dbRoomToApp(row: RoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    vertices: row.vertices,
    x: row.x,
    y: row.y,
    widthPx: row.width_px,
    heightPx: row.height_px,
    floorPlanId: row.floor_plan_id,
  };
}
