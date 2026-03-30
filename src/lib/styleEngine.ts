// Style engine — client module for AI room restyling via Replicate

import { buildPrompt, DEFAULT_NEGATIVE_PROMPT } from '../data/stylePresets';

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

/**
 * Get the user's Replicate API key from localStorage.
 */
export function getReplicateApiKey(): string | null {
  return localStorage.getItem('floorish_replicate_key');
}

/**
 * Store the user's Replicate API key in localStorage.
 */
export function setReplicateApiKey(key: string): void {
  localStorage.setItem('floorish_replicate_key', key);
}

/**
 * Remove the stored Replicate API key.
 */
export function clearReplicateApiKey(): void {
  localStorage.removeItem('floorish_replicate_key');
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
