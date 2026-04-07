// Vercel serverless function — proxies style generation requests to Replicate.
// The user's Replicate API key is passed via X-Replicate-Key header (BYOK).

import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API = 'https://api.replicate.com/v1';

// ControlNet img2img model — restyle mode (change aesthetic of furnished room)
const RESTYLE_MODEL_VERSION = 'rossjillian/controlnet:795433b19458d0f4fa172a7ccf93178d2adb1cb8ab2ad6c8fdc33fdbcd49f477';

// Interior design model — stage mode (add furniture to empty room)
// Uses room segmentation + MLSD ControlNet for structure-aware staging
const STAGE_MODEL_VERSION = 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38';

type StyleMode = 'stage' | 'restyle';

interface RestyleRequestBody {
  image: string;           // base64-encoded source image
  prompt: string;
  negative_prompt: string;
  denoise_strength: number;
  mode?: StyleMode;        // defaults to 'restyle' for backward compatibility
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers — allow production + Vercel preview deployments
  const origin = req.headers.origin as string | undefined;
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : ['https://floorish.vercel.app'];

  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    /^https:\/\/floorish[a-z0-9-]*\.vercel\.app$/.test(origin)
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Replicate-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = req.headers['x-replicate-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ message: 'Missing Replicate API key' });
  }

  // GET with ?test=1 — connection test
  if (req.method === 'GET' && req.query.test) {
    try {
      const testResp = await fetch(`${REPLICATE_API}/hardware`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (testResp.ok) {
        return res.status(200).json({ ok: true });
      }
      return res.status(testResp.status).json({
        message: `Replicate returned ${testResp.status}`,
      });
    } catch (err) {
      return res.status(502).json({
        message: `Failed to reach Replicate: ${(err as Error).message}`,
      });
    }
  }

  // GET with ?poll=<url> — poll a prediction status (proxied to avoid CORS)
  if (req.method === 'GET' && req.query.poll) {
    const pollUrl = req.query.poll as string;
    if (!pollUrl.startsWith(REPLICATE_API)) {
      return res.status(400).json({ message: 'Invalid poll URL' });
    }
    try {
      const pollResp = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollResp.ok) {
        const errorBody = await pollResp.json().catch(() => ({}));
        return res.status(pollResp.status).json({
          message: (errorBody as { detail?: string }).detail ?? `Replicate polling error: ${pollResp.status}`,
          code: 'REPLICATE_ERROR',
        });
      }
      const result = await pollResp.json();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(502).json({
        message: `Failed to poll Replicate: ${(err as Error).message}`,
        code: 'POLL_ERROR',
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body as RestyleRequestBody;
  if (!body.image || !body.prompt) {
    return res.status(400).json({ message: 'Missing required fields: image, prompt' });
  }

  const mode: StyleMode = body.mode === 'stage' ? 'stage' : 'restyle';

  // Validate denoise_strength / prompt_strength bounds
  const strength = body.denoise_strength ?? (mode === 'stage' ? 0.8 : 0.65);
  if (mode === 'restyle') {
    if (strength < 0.35 || strength > 0.85) {
      return res.status(400).json({ message: 'denoise_strength must be between 0.35 and 0.85' });
    }
  } else {
    if (strength < 0 || strength > 1) {
      return res.status(400).json({ message: 'prompt_strength must be between 0 and 1' });
    }
  }

  // Reject excessively large base64 payloads (>10 MB encoded ≈ ~7.5 MB image)
  if (body.image.length > 10 * 1024 * 1024) {
    return res.status(400).json({ message: 'Image payload too large (max 10 MB base64)' });
  }

  try {
    // Build model-specific prediction request
    const modelVersion = mode === 'stage' ? STAGE_MODEL_VERSION : RESTYLE_MODEL_VERSION;
    const version = modelVersion.split(':')[1];

    const input = mode === 'stage'
      ? {
          image: `data:image/jpeg;base64,${body.image}`,
          prompt: body.prompt,
          negative_prompt: body.negative_prompt || '',
          guidance_scale: 15,
          num_inference_steps: 50,
          prompt_strength: strength,
        }
      : {
          image: `data:image/jpeg;base64,${body.image}`,
          prompt: body.prompt,
          negative_prompt: body.negative_prompt || '',
          structure: 'depth',
          steps: 30,
          eta: strength,
          scale: 7.5,
          image_resolution: 512,
        };

    const createResp = await fetch(`${REPLICATE_API}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version, input }),
    });

    if (!createResp.ok) {
      const errorBody = await createResp.json().catch(() => ({}));
      return res.status(createResp.status).json({
        message: (errorBody as { detail?: string }).detail ?? `Replicate error: ${createResp.status}`,
        code: 'REPLICATE_ERROR',
      });
    }

    const prediction = await createResp.json();

    // Return prediction immediately — client polls Replicate directly (BYOK)
    const pollUrl = prediction?.urls?.get;
    if (!pollUrl) {
      return res.status(500).json({
        message: 'Invalid response from Replicate: missing polling URL',
        code: 'INVALID_POLL_RESPONSE',
      });
    }

    return res.status(202).json({
      id: prediction.id,
      status: prediction.status,
      poll_url: pollUrl,
    });
  } catch (err) {
    return res.status(500).json({
      message: `Server error: ${(err as Error).message}`,
      code: 'INTERNAL_ERROR',
    });
  }
}
