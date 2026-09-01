/**
 * AI 3D Model Generation Service
 * 
 * Automated pipeline: satellite specs → AI prompt → 3D model (GLB)
 * Supports multiple providers with automatic fallback.
 * 
 * Provider priority:
 *  1. Tripo3D    — fastest, good quality, ~$0.10-0.30/model
 *  2. Meshy AI   — best textures, two-step (preview → refine)
 *  3. Hunyuan3D  — Tencent, highest detail, enterprise-grade
 * 
 * Usage:
 *   const glbUrl = await generate3DModel(design, { provider: 'tripo' });
 */

const PROVIDERS = {
  tripo: {
    name: 'Tripo3D',
    baseUrl: 'https://api.tripo3d.ai/v2/openapi',
    envKey: 'TRIPO_API_KEY',
  },
  meshy: {
    name: 'Meshy AI',
    baseUrl: 'https://api.meshy.ai',
    envKey: 'MESHY_API_KEY',
  },
  hunyuan: {
    name: 'Tencent Hunyuan3D',
    baseUrl: 'https://3d-api.hunyuan.tencent.com',
    envKey: 'HUNYUAN_API_KEY',
  },
};

/**
 * Build a detailed prompt from the satellite design data.
 * This is the core of the automation — no human input needed.
 */
function buildSatellitePrompt(design) {
  const p = design.missionProfile || {};
  const subs = design.subsystems || [];

  const subsystemDescriptions = subs.map(sub => {
    switch (sub.type) {
      case 'bus':
        return `a rectangular satellite bus body (${p.totalMassKg || 50}kg class)`;
      case 'solar':
        const panelCount = sub.components?.find(c =>
          c.name?.toLowerCase().includes('solar')
        )?.name?.match(/(\d+)/)?.[1] || '2';
        return `${panelCount} deployed rectangular solar panel wings extending from the sides`;
      case 'camera':
        return 'a cylindrical optical camera payload module on the nadir (bottom) face with a dark lens';
      case 'antenna':
        const hasParabolic = sub.components?.some(c =>
          c.name?.toLowerCase().includes('band') || c.name?.toLowerCase().includes('dish')
        );
        return hasParabolic
          ? 'a parabolic dish antenna mounted on top with a feed horn'
          : 'a small antenna array on the top face';
      case 'adcs':
        return 'small attitude control modules (reaction wheels) visible on one side panel';
      case 'thruster':
        return 'a small thruster nozzle on the rear face with a conical exhaust bell';
      case 'thermal':
        return 'gold-colored multi-layer insulation (MLI) thermal blankets wrapping parts of the bus';
      default:
        return null;
    }
  }).filter(Boolean);

  const sizeClass = (p.totalMassKg || 50) < 20 ? 'CubeSat' :
                    (p.totalMassKg || 50) < 100 ? 'microsatellite' :
                    (p.totalMassKg || 50) < 500 ? 'small satellite' : 'large satellite';

  const prompt = [
    `A realistic ${sizeClass} in low-earth orbit.`,
    `The satellite has: ${subsystemDescriptions.join('; ')}.`,
    `Technical aerospace engineering style.`,
    `Metallic and composite materials with realistic PBR textures.`,
    `Gold MLI foil, dark blue solar cells, silver structural elements.`,
    `Black space background. Professional engineering visualization.`,
    `High detail, photorealistic materials, clean geometry.`,
  ].join(' ');

  return prompt;
}

/* ═══════════════════════════════════════
   Tripo3D Provider
   ═══════════════════════════════════════ */
async function tripoGenerate(prompt, apiKey) {
  // Step 1: Create task
  const createRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: 'text_to_model',
      prompt,
      model_version: 'default',
    }),
  });

  const body = await createRes.json();
  if (!createRes.ok || (body.code !== undefined && body.code !== 0)) {
    const msg = body.message || body.suggestion || JSON.stringify(body);
    throw new Error(`Tripo3D (${body.code || createRes.status}): ${msg}`);
  }

  const taskId = body.data?.task_id;
  if (!taskId) throw new Error('Tripo3D: No task_id returned in response');

  // Step 2: Poll for completion
  const glbUrl = await pollTripoTask(taskId, apiKey);
  return glbUrl;
}

async function pollTripoTask(taskId, apiKey, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    const res = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!res.ok) continue;
    const { data } = await res.json();

    if (data.status === 'success') {
      return data.output?.model;
    }
    if (data.status === 'failed') {
      throw new Error(`Tripo task failed: ${data.output?.message || 'Unknown error'}`);
    }
    // status is 'queued' or 'running' — keep polling
  }
  throw new Error('Tripo task timed out');
}

/* ═══════════════════════════════════════
   Meshy AI Provider (two-step)
   ═══════════════════════════════════════ */
async function meshyGenerate(prompt, apiKey) {
  // Step 1: Create preview task
  const previewRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: 'realistic',
      topology: 'triangle',
      target_polycount: 30000,
    }),
  });

  if (!previewRes.ok) {
    const err = await previewRes.text();
    throw new Error(`Meshy preview failed: ${previewRes.status} ${err}`);
  }

  const { result: previewTaskId } = await previewRes.json();

  // Step 2: Poll preview
  await pollMeshyTask(previewTaskId, apiKey);

  // Step 3: Create refine task
  const refineRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mode: 'refine',
      preview_task_id: previewTaskId,
    }),
  });

  if (!refineRes.ok) {
    const err = await refineRes.text();
    throw new Error(`Meshy refine failed: ${refineRes.status} ${err}`);
  }

  const { result: refineTaskId } = await refineRes.json();

  // Step 4: Poll refine → get GLB URL
  const result = await pollMeshyTask(refineTaskId, apiKey);
  return result.model_urls?.glb;
}

async function pollMeshyTask(taskId, apiKey, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);

    const res = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!res.ok) continue;
    const data = await res.json();

    if (data.status === 'SUCCEEDED') {
      return data;
    }
    if (data.status === 'FAILED' || data.status === 'EXPIRED') {
      throw new Error(`Meshy task ${data.status}: ${data.task_error?.message || 'Unknown'}`);
    }
  }
  throw new Error('Meshy task timed out');
}

/* ═══════════════════════════════════════
   Tencent Hunyuan3D Provider
   ═══════════════════════════════════════ */
async function hunyuanGenerate(prompt, apiKey) {
  // Step 1: Submit job
  const submitRes = await fetch('https://3d-api.hunyuan.tencent.com/v1/3d-models/tencent/generate/rapid/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      output_format: 'glb',
      texture: true,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Hunyuan submit failed: ${submitRes.status} ${err}`);
  }

  const { task_id } = await submitRes.json();

  // Step 2: Poll
  for (let i = 0; i < 90; i++) {
    await sleep(4000);
    const res = await fetch(`https://3d-api.hunyuan.tencent.com/v1/3d-models/tencent/tasks/${task_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === 'FINISHED' || data.status === 'success') {
      return data.output?.model_url || data.model_url;
    }
    if (data.status === 'FAILED') {
      throw new Error('Hunyuan task failed');
    }
  }
  throw new Error('Hunyuan task timed out');
}

/* ═══════════════════════════════════════
   Main entry point
   ═══════════════════════════════════════ */

/**
 * Generate a 3D GLB model from satellite design data.
 * Fully automated — no human interaction needed.
 * 
 * @param {Object} design - The satellite design from Claude AI
 * @param {Object} options
 * @param {string} options.provider - 'tripo' | 'meshy' | 'hunyuan' | 'auto'
 * @returns {Promise<string>} URL to the generated GLB file
 */
export async function generate3DModel(design, { provider = 'auto' } = {}) {
  const prompt = buildSatellitePrompt(design);
  console.log('[3DGen] Prompt:', prompt);

  const providerOrder = provider === 'auto'
    ? ['tripo', 'meshy', 'hunyuan']
    : [provider];

  for (const p of providerOrder) {
    const config = PROVIDERS[p];
    if (!config) continue;

    const apiKey = typeof process !== 'undefined'
      ? process.env?.[config.envKey]
      : null;

    if (!apiKey) {
      console.log(`[3DGen] Skipping ${config.name} — no API key (${config.envKey})`);
      continue;
    }

    try {
      console.log(`[3DGen] Using ${config.name}...`);
      let glbUrl;
      switch (p) {
        case 'tripo':   glbUrl = await tripoGenerate(prompt, apiKey);   break;
        case 'meshy':   glbUrl = await meshyGenerate(prompt, apiKey);   break;
        case 'hunyuan': glbUrl = await hunyuanGenerate(prompt, apiKey); break;
      }
      console.log(`[3DGen] Success via ${config.name}:`, glbUrl);
      return glbUrl;
    } catch (err) {
      console.error(`[3DGen] ${config.name} failed:`, err.message);
      if (provider !== 'auto') throw err;
      // auto mode: try next provider
    }
  }

  throw new Error('All 3D generation providers failed. Set one of: TRIPO_API_KEY, MESHY_API_KEY, HUNYUAN_API_KEY');
}

/**
 * Export the prompt builder so it can be used by the server-side
 * API route as well.
 */
export { buildSatellitePrompt };

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
