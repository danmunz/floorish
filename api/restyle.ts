// Vercel serverless function — proxies style generation requests to Replicate.
// The user's Replicate API key is passed via X-Replicate-Key header (BYOK).

import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API = 'https://api.replicate.com/v1';

// ControlNet img2img model on Replicate
// Using jagilley/controlnet-depth for depth-conditioned generation
const MODEL_VERSION = 'jagilley/controlnet-depth:cec3dc6e8389c0384f64f3f7e8dd6fc85dbc2f66d74345cf67bfc9ac0607bfef';

interface RestyleRequestBody {
  image: string;           // base64-encoded source image
  prompt: string;
  negative_prompt: string;
  denoise_strength: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const origin = req.headers.origin as string | undefined;
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
    : ['https://floorish.vercel.app'];

  if (origin && allowedOrigins.includes(origin)) {
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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body as RestyleRequestBody;
  if (!body.image || !body.prompt) {
    return res.status(400).json({ message: 'Missing required fields: image, prompt' });
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
          n_prompt: body.negative_prompt || '',
          ddim_steps: 30,
          strength: body.denoise_strength ?? 0.65,
          scale: 7.5,
          detect_resolution: 512,
          image_resolution: 512,
          a_prompt: 'best quality, high resolution',
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
    let result = prediction;

    // Poll for completion (max 90 seconds)
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'succeeded') {
        const output = Array.isArray(result.output) ? result.output[0] : result.output;
        return res.status(200).json({ output });
      }
      if (result.status === 'failed' || result.status === 'canceled') {
        return res.status(500).json({
          message: result.error || 'Generation failed',
          code: 'GENERATION_FAILED',
        });
      }

      await new Promise(r => setTimeout(r, 1500));

      const pollResp = await fetch(result.urls.get, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      result = await pollResp.json();
    }

    return res.status(504).json({ message: 'Generation timed out', code: 'TIMEOUT' });
  } catch (err) {
    return res.status(500).json({
      message: `Server error: ${(err as Error).message}`,
      code: 'INTERNAL_ERROR',
    });
  }
}
