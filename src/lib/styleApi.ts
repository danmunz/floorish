// Supabase API helpers for room photos and style generations

import { supabase } from './supabase';

// ── Room Photos ──

export interface RoomPhoto {
  id: string;
  project_id: string;
  floor_plan_id: string | null;
  room_id: string | null;
  image_path: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export async function fetchRoomPhotos(projectId: string): Promise<RoomPhoto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('room_photos')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as RoomPhoto[];
}

export async function insertRoomPhoto(photo: {
  project_id: string;
  floor_plan_id?: string | null;
  room_id?: string | null;
  image_path: string;
  name: string;
  sort_order?: number;
}): Promise<RoomPhoto> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('room_photos')
    .insert(photo)
    .select()
    .single();
  if (error) throw error;
  return data as RoomPhoto;
}

export async function deleteRoomPhotoRecord(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('room_photos').delete().eq('id', id);
  if (error) throw error;
}

// ── Style Generations ──

export type StyleGenerationStatus = 'pending' | 'completed' | 'failed';

export interface StyleGeneration {
  id: string;
  project_id: string;
  source_photo_id: string | null;
  style_preset: string | null;
  prompt: string;
  negative_prompt: string | null;
  denoise_strength: number;
  result_image_path: string | null;
  status: StyleGenerationStatus;
  error_message: string | null;
  mode: string | null;
  room_id: string | null;
  created_at: string;
}

export async function fetchStyleGenerations(projectId: string): Promise<StyleGeneration[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('style_generations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StyleGeneration[];
}

export async function insertStyleGeneration(gen: {
  project_id: string;
  source_photo_id?: string | null;
  style_preset?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  denoise_strength: number;
  result_image_path?: string | null;
  status: StyleGenerationStatus;
  error_message?: string | null;
  mode?: string | null;
}): Promise<StyleGeneration> {
  error_message?: string | null;
}): Promise<StyleGeneration> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('style_generations')
    .insert(gen)
    .select()
    .single();
  if (error) throw error;
  return data as StyleGeneration;
}

export async function updateStyleGeneration(
  id: string,
  updates: Partial<{
    result_image_path: string | null;
    status: StyleGenerationStatus;
    error_message: string | null;
  }>
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('style_generations')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteStyleGeneration(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('style_generations').delete().eq('id', id);
  if (error) throw error;
}
