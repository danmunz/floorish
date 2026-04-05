// Vercel serverless function — proxies style generation requests to Replicate.
// The user's Replicate API key is passed via X-Replicate-Key header (BYOK).

import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API = 'https://api.replicate.com/v1';

// ControlNet img2img model on Replicate
// Using rossjillian/controlnet with depth structure conditioning
const MODEL_VERSION = 'rossjillian/controlnet:795433b19458d0f4fa172a7ccf93178d2adb1cb8ab2ad6c8fdc33fdbcd49f477';

interface RestyleRequestBody {
  image: string;           // base64-encoded source image
  prompt: string;
  negative_prompt: string;
  denoise_strength: number;
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

  // Validate denoise_strength bounds
  const denoise = body.denoise_strength ?? 0.65;
  if (denoise < 0.35 || denoise > 0.85) {
    return res.status(400).json({ message: 'denoise_strength must be between 0.35 and 0.85' });
  }

  // Reject excessively large base64 payloads (>10 MB encoded ≈ ~7.5 MB image)
  if (body.image.length > 10 * 1024 * 1024) {
    return res.status(400).json({ message: 'Image payload too large (max 10 MB base64)' });
  }

  try {
    // Create a prediction on Replicate
    const version = MODEL_VERSION.split(':')[1];

    const createResp = await fetch(`${REPLICATE_API}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        input: {
          image: `data:image/jpeg;base64,${body.image}`,
          prompt: body.prompt,
          negative_prompt: body.negative_prompt || '',
          structure: 'depth',
          steps: 30,
          eta: body.denoise_strength ?? 0.65,
          scale: 7.5,
          image_resolution: 512,
        },
      }),
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
