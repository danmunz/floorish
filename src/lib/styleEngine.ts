// Style engine — client module for AI room restyling via Replicate

import { buildPrompt, DEFAULT_NEGATIVE_PROMPT } from '../data/stylePresets';
import { supabase } from './supabase';

export interface RestyleRequest {
  imageBase64: string;       // base64-encoded source image (no data: prefix)
  stylePresetId: string;
  customModifiers?: string;
  denoiseStrength: number;   // 0.35–0.85
}

export interface RestyleResult {
  imageUrl: string;
  prompt: string;
  negativePrompt: string;
  denoiseStrength: number;
}

export interface RestyleError {
  message: string;
  code?: string;
}

const API_ENDPOINT = '/api/restyle';
const LOCAL_KEY = 'floorish_replicate_key';

/**
 * Get the user's Replicate API key from the localStorage cache.
 */
export function getReplicateApiKey(): string | null {
  return localStorage.getItem(LOCAL_KEY);
}

/**
 * Store the user's Replicate API key in localStorage (cache only).
 */
export function setReplicateApiKey(key: string): void {
  localStorage.setItem(LOCAL_KEY, key);
}

/**
 * Remove the cached Replicate API key from localStorage.
 */
export function clearReplicateApiKey(): void {
  localStorage.removeItem(LOCAL_KEY);
}

/**
 * Load the user's Replicate API key from Supabase profiles into localStorage.
 * Call once on login / app init for authenticated users.
 */
export async function loadReplicateApiKeyFromProfile(userId: string): Promise<string | null> {
  if (!supabase) return getReplicateApiKey();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('replicate_api_key')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data?.replicate_api_key) return getReplicateApiKey();
    localStorage.setItem(LOCAL_KEY, data.replicate_api_key);
    return data.replicate_api_key;
  } catch {
    return getReplicateApiKey();
  }
}

/**
 * Save the user's Replicate API key to both localStorage and Supabase profiles.
 */
export async function saveReplicateApiKey(key: string, userId?: string): Promise<void> {
  localStorage.setItem(LOCAL_KEY, key);
  if (!supabase || !userId) return;
  try {
    await supabase
      .from('profiles')
      .update({ replicate_api_key: key })
      .eq('id', userId);
  } catch {
    // localStorage is already set — DB sync is best-effort
  }
}

/**
 * Remove the user's Replicate API key from both localStorage and Supabase profiles.
 */
export async function removeReplicateApiKey(userId?: string): Promise<void> {
  localStorage.removeItem(LOCAL_KEY);
  if (!supabase || !userId) return;
  try {
    await supabase
      .from('profiles')
      .update({ replicate_api_key: null })
      .eq('id', userId);
  } catch {
    // best-effort
  }
}

/**
 * Test connectivity to Replicate via the proxy.
 */
export async function testReplicateConnection(): Promise<boolean> {
  const apiKey = getReplicateApiKey();
  if (!apiKey) return false;

  try {
    const resp = await fetch(`${API_ENDPOINT}?test=1`, {
      headers: { 'X-Replicate-Key': apiKey },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Convert a File or Blob to a base64 string (without data: prefix).
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image to fit within maxSize while preserving aspect ratio.
 * Returns a base64-encoded JPEG string (no prefix).
 */
export function resizeImageToBase64(
  imageUrl: string,
  maxSize = 768
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Generate a restyled room image via the Replicate proxy.
 */
export async function generateRestyle(request: RestyleRequest): Promise<RestyleResult> {
  const apiKey = getReplicateApiKey();
  if (!apiKey) {
    throw new Error('Replicate API key not configured. Add your key in settings.');
  }

  const prompt = buildPrompt(request.stylePresetId, request.customModifiers);
  const negativePrompt = DEFAULT_NEGATIVE_PROMPT;

  const resp = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Replicate-Key': apiKey,
    },
    body: JSON.stringify({
      image: request.imageBase64,
      prompt,
      negative_prompt: negativePrompt,
      denoise_strength: request.denoiseStrength,
    }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(
      (body as RestyleError).message ?? `API error: ${resp.status} ${resp.statusText}`
    );
  }

  const data = await resp.json();
  return {
    imageUrl: data.output,
    prompt,
    negativePrompt,
    denoiseStrength: request.denoiseStrength,
  };
}
