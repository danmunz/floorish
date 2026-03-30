// Storage helpers for room photos and style generation results

import { supabase } from './supabase';

const ROOM_PHOTOS_BUCKET = 'room-photos';
const STYLE_RESULTS_BUCKET = 'style-results';

export async function uploadRoomPhoto(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(ROOM_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  return path;
}

export async function getRoomPhotoUrl(path: string): Promise<string | null> {
  if (!supabase || !path) return null;

  const { data, error } = await supabase.storage
    .from(ROOM_PHOTOS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Failed to get room photo URL:', error);
    return null;
  }
  return data.signedUrl;
}

export async function deleteRoomPhoto(path: string): Promise<void> {
  if (!supabase || !path) return;
  const { error } = await supabase.storage.from(ROOM_PHOTOS_BUCKET).remove([path]);
  if (error) console.error('Failed to delete room photo:', error);
}

export async function uploadStyleResult(
  imageBlob: Blob,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from(STYLE_RESULTS_BUCKET)
    .upload(path, imageBlob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });

  if (error) throw error;
  return path;
}

export async function getStyleResultUrl(path: string): Promise<string | null> {
  if (!supabase || !path) return null;

  const { data, error } = await supabase.storage
    .from(STYLE_RESULTS_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    console.error('Failed to get style result URL:', error);
    return null;
  }
  return data.signedUrl;
}
