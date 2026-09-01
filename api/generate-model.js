/**
 * POST /api/generate-model
 * 
 * Accepts a satellite design and generates a 3D GLB model via
 * AI providers (Tripo3D → Meshy → Hunyuan3D fallback chain).
 * 
 * Request:  { design: SatelliteDesign, provider?: 'tripo'|'meshy'|'hunyuan'|'auto' }
 * Response: { glbUrl: string, provider: string, prompt: string }
 * 
 * Required env vars (at least one):
 *   TRIPO_API_KEY, MESHY_API_KEY, HUNYUAN_API_KEY
 */

const PROVIDERS = {
  tripo: {
    name: 'Tripo3D',
    envKey: 'TRIPO_API_KEY',
  },
  meshy: {
    name: 'Meshy AI',
    envKey: 'MESHY_API_KEY',
  },
  hunyuan: {
    name: 'Tencent Hunyuan3D',
    envKey: 'HUNYUAN_API_KEY',
  },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
        return `${panelCount} deployed rectangular solar panel wings extending from each side`;
      case 'camera':
        return 'a cylindrical optical camera module on the bottom with a dark lens';
      case 'antenna':
        return 'a parabolic dish antenna on top with a feed horn';
      case 'adcs':
        return 'small attitude control modules on a side panel';
      case 'thruster':
        return 'a conical thruster nozzle on the rear';
      case 'thermal':
        return 'gold MLI thermal blanket wrapping parts of the bus';
      default: return null;
    }
  }).filter(Boolean);

  const sizeClass = (p.totalMassKg || 50) < 20 ? 'CubeSat' :
                    (p.totalMassKg || 50) < 100 ? 'microsatellite' :
                    (p.totalMassKg || 50) < 500 ? 'small satellite' : 'large satellite';

  return [
    `Realistic ${sizeClass} spacecraft in orbit.`,
    `Features: ${subsystemDescriptions.join('; ')}.`,
    `Aerospace engineering style, metallic PBR materials.`,
    `Gold foil, dark blue solar cells, silver structure. High detail.`,
  ].join(' ');
}

/* ── Tripo3D ── */
async function tripoGenerate(prompt, apiKey) {
  const res = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ type: 'text_to_model', prompt }),
  });
  const body = await res.json();
  if (!res.ok || (body.code !== undefined && body.code !== 0)) {
    const msg = body.message || body.suggestion || JSON.stringify(body);
    throw new Error(`Tripo3D (${body.code || res.status}): ${msg}`);
  }
  const taskId = body.data?.task_id;
  if (!taskId) throw new Error('Tripo3D: No task_id returned in response');

  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const poll = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!poll.ok) continue;
    const { data: d } = await poll.json();
    if (d.status === 'success') return d.output?.model;
    if (d.status === 'failed') throw new Error('Tripo task failed');
  }
  throw new Error('Tripo timeout');
}

/* ── Meshy AI ── */
async function meshyGenerate(prompt, apiKey) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

  // Preview
  const prevRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST', headers,
    body: JSON.stringify({ mode: 'preview', prompt, art_style: 'realistic' }),
  });
  if (!prevRes.ok) throw new Error(`Meshy preview: ${prevRes.status}`);
  const { result: prevId } = await prevRes.json();

  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const poll = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${prevId}`, { headers });
    if (!poll.ok) continue;
    const d = await poll.json();
    if (d.status === 'SUCCEEDED') break;
    if (d.status === 'FAILED') throw new Error('Meshy preview failed');
  }

  // Refine
  const refRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST', headers,
    body: JSON.stringify({ mode: 'refine', preview_task_id: prevId }),
  });
  if (!refRes.ok) throw new Error(`Meshy refine: ${refRes.status}`);
  const { result: refId } = await refRes.json();

  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const poll = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${refId}`, { headers });
    if (!poll.ok) continue;
    const d = await poll.json();
    if (d.status === 'SUCCEEDED') return d.model_urls?.glb;
    if (d.status === 'FAILED') throw new Error('Meshy refine failed');
  }
  throw new Error('Meshy timeout');
}

/* ── Hunyuan3D ── */
async function hunyuanGenerate(prompt, apiKey) {
  const res = await fetch('https://3d-api.hunyuan.tencent.com/v1/3d-models/tencent/generate/rapid/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ prompt, output_format: 'glb', texture: true }),
  });
  if (!res.ok) throw new Error(`Hunyuan: ${res.status}`);
  const { task_id } = await res.json();

  for (let i = 0; i < 90; i++) {
    await sleep(4000);
    const poll = await fetch(`https://3d-api.hunyuan.tencent.com/v1/3d-models/tencent/tasks/${task_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!poll.ok) continue;
    const d = await poll.json();
    if (d.status === 'FINISHED') return d.output?.model_url || d.model_url;
    if (d.status === 'FAILED') throw new Error('Hunyuan failed');
  }
  throw new Error('Hunyuan timeout');
}

/* ── Handler ── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { design, provider = 'auto' } = req.body || {};
  if (!design) {
    return res.status(400).json({ error: 'Missing design object' });
  }

  const prompt = buildSatellitePrompt(design);
  const order = provider === 'auto' ? ['tripo', 'meshy', 'hunyuan'] : [provider];
  const errors = [];

  for (const p of order) {
    const config = PROVIDERS[p];
    if (!config) continue;

    const apiKey = process.env[config.envKey];
    if (!apiKey) {
      errors.push(`${config.name}: no API key (set ${config.envKey})`);
      continue;
    }

    try {
      console.log(`[3DGen] Trying ${config.name}...`);
      let glbUrl;
      switch (p) {
        case 'tripo':   glbUrl = await tripoGenerate(prompt, apiKey);   break;
        case 'meshy':   glbUrl = await meshyGenerate(prompt, apiKey);   break;
        case 'hunyuan': glbUrl = await hunyuanGenerate(prompt, apiKey); break;
      }

      return res.json({ glbUrl, provider: config.name, prompt });
    } catch (err) {
      console.error(`[3DGen] ${config.name}:`, err.message);
      errors.push(`${config.name}: ${err.message}`);
      if (provider !== 'auto') {
        return res.status(502).json({ error: err.message, provider: config.name, prompt });
      }
    }
  }

  return res.status(503).json({
    error: 'No 3D provider available',
    details: errors,
    prompt,
    hint: 'Set at least one env var: TRIPO_API_KEY, MESHY_API_KEY, or HUNYUAN_API_KEY',
  });
}
