import { supabase } from './supabase';

const BUCKET = 'floor-plans';

export async function uploadFloorPlanImage(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const ext = file.name.split('.').pop() || 'png';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;
  return path;
}

export async function getFloorPlanImageUrl(
  path: string
): Promise<string | null> {
  if (!supabase || !path) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600); // 1-hour signed URL

  if (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

export async function deleteFloorPlanImage(path: string): Promise<void> {
  if (!supabase || !path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error('Failed to delete image:', error);
}
