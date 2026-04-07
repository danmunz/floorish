// Style engine — client module for AI room restyling via Replicate

import { buildPrompt, getNegativePrompt } from '../data/stylePresets';
import type { StyleMode } from '../data/stylePresets';
import { supabase } from './supabase';

export interface RestyleRequest {
  imageBase64: string;       // base64-encoded source image (no data: prefix)
  stylePresetId: string;
  customModifiers?: string;
  denoiseStrength: number;   // 0.35–0.85 (restyle) or prompt_strength 0–1 (stage)
  mode: StyleMode;           // 'stage' or 'restyle'
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
 * Generate a restyled room image via the Replicate proxy + client-side polling.
 * The server creates the prediction and returns a poll URL; the client polls
 * Replicate directly using the user's own API key (BYOK).
 */
export async function generateRestyle(request: RestyleRequest): Promise<RestyleResult> {
  const apiKey = getReplicateApiKey();
  if (!apiKey) {
    throw new Error('Replicate API key not configured. Add your key in settings.');
  }

  const prompt = buildPrompt(request.stylePresetId, request.mode, request.customModifiers);
  const negativePrompt = getNegativePrompt(request.mode);

  // Step 1: Create prediction via the Vercel proxy
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
      mode: request.mode,
    }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(
      (body as RestyleError).message ?? `API error: ${resp.status} ${resp.statusText}`
    );
  }

  const prediction = await resp.json();
  const pollUrl: string | undefined = prediction.poll_url;
  if (!pollUrl) {
    throw new Error('No polling URL returned from server');
  }

  // Step 2: Poll Replicate via proxy (avoids browser CORS restrictions)
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1500));

    const pollResp = await fetch(
      `${API_ENDPOINT}?poll=${encodeURIComponent(pollUrl)}`,
      { headers: { 'X-Replicate-Key': apiKey } },
    );

    if (!pollResp.ok) {
      throw new Error(`Replicate polling error: ${pollResp.status}`);
    }

    const result = await pollResp.json();

    if (result.status === 'succeeded') {
      const output = Array.isArray(result.output) ? result.output[0] : result.output;
      return {
        imageUrl: output,
        prompt,
        negativePrompt,
        denoiseStrength: request.denoiseStrength,
      };
    }

    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(result.error || 'Generation failed');
    }
  }

  throw new Error('Generation timed out after 90 seconds');
}
