import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// Use gemini-3.6-flash — fast, free tier, 1M context window
const MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

app.use(cors({ origin: true }));
app.use(express.json());

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert Space Systems Engineering AI for a platform called Orbital.
You operate in two modes: INTERVIEW and DESIGN.

### MODE 1 - INTERVIEW
Triggered when the user submits a mission description.

If any of the following are missing or ambiguous, return ONLY this JSON:
{ "interviewStatus": "PENDING", "pendingQuestions": ["<one focused question>"] }

Ask ONLY ONE question at a time. Do not number it. Do not explain why you are asking.

Required parameters to collect:
- Orbit type or target region (drives orbit selection)
- Primary payload purpose (imaging, sensing, communications, relay)
- Key performance target (resolution, bandwidth, revisit frequency)
- Mission lifetime in years
- Budget range or size class (CubeSat / microsatellite / small satellite)

When ALL parameters are known, set interviewStatus to "COMPLETE" and return the full SatelliteDesign JSON immediately.

### MODE 2 - DESIGN
Triggered when interviewStatus is COMPLETE.
Return ONLY valid JSON. No prose outside the JSON object.

ENGINEERING RULES:
- Mass, power, and cost budgets must be internally consistent.
- Surface all assumptions in missionProfile.assumptions array.
- Eclipse margin must be positive. Flag powerBalance.status as "Critical" if below 10%.
- Express all costs as min/mid/max ranges, never single figures.
- Generate exactly 2 tradeOffVariants: one cost-optimized, one mass-optimized.
- Each subsystem must include a one-sentence educationNote for a technically curious non-engineer.

SatelliteDesign JSON schema:
{
  "interviewStatus": "COMPLETE",
  "missionProfile": {
    "name": string,
    "description": string,
    "orbitType": "LEO"|"MEO"|"GEO"|"SSO",
    "altitudeKm": number,
    "inclinationDeg": number,
    "targetLifespanYears": number,
    "totalMassKg": number,
    "totalPowerW": number,
    "estimatedCostUSD": { "min": number, "mid": number, "max": number, "confidence": "Low"|"Medium"|"High" },
    "assumptions": [string]
  },
  "subsystems": [
    {
      "id": string,
      "name": string,
      "rationale": string,
      "educationNote": string,
      "components": [
        {
          "name": string,
          "role": string,
          "massKg": number,
          "powerConsumptionW": number,
          "estimatedCostUSD": { "min": number, "mid": number, "max": number },
          "specifications": {},
          "redundancy": "Single"|"Dual"|"N+1",
          "alternatives": [string]
        }
      ]
    }
  ],
  "simulations": {
    "powerBalance": {
      "generationW": number,
      "consumptionW": number,
      "eclipseMarginPercent": number,
      "batteryCapacityWh": number,
      "status": "Healthy"|"Marginal"|"Critical"
    },
    "dataDownlink": {
      "dailyDataGb": number,
      "requiredPassesPerDay": number,
      "groundStationRequirements": string
    }
  },
  "tradeOffVariants": [
    {
      "title": string,
      "objective": "Cost"|"Mass"|"Power"|"Performance"|"Reliability",
      "description": string,
      "changes": [string],
      "benefit": string,
      "sacrifice": string,
      "impactMassKg": number,
      "impactCostUSD": number
    }
  ]
}`;

// ── Gemini API helper ──────────────────────────────────────────────────────
// Converts OpenAI-style history [{role:'user'|'assistant', content}]
// into Gemini contents format [{role:'user'|'model', parts:[{text}]}]
function toGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function callGemini(messages) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is not set in .env');

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',  // ask Gemini to return raw JSON
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!raw) throw new Error('Empty response from Gemini');

  // Strip markdown fences just in case
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(clean);
}

// ── Routes ─────────────────────────────────────────────────────────────────

app.post('/api/interview', async (req, res) => {
  try {
    const { missionDescription, archetypeId, history = [] } = req.body;

    let messages;
    if (history.length === 0) {
      const ctx = archetypeId ? `The user selected the "${archetypeId}" archetype.\n\n` : '';
      messages = [{ role: 'user', content: `${ctx}Mission description: ${missionDescription}` }];
    } else {
      messages = history;
    }

    const result = await callGemini(messages);
    res.json(result);
  } catch (err) {
    console.error('[/api/interview]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/interview/answer', async (req, res) => {
  try {
    const { history = [], answer } = req.body;
    const messages = [...history, { role: 'user', content: answer }];
    const result = await callGemini(messages);
    res.json(result);
  } catch (err) {
    console.error('[/api/interview/answer]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, keyLoaded: !!GEMINI_KEY });
});

// ── 3D Model Generation ──────────────────────────────────────────────────
// Import and mount the Vercel-compatible handler as an Express route
import generateModelHandler from '../../api/generate-model.js';

app.post('/api/generate-model', async (req, res) => {
  try {
    await generateModelHandler(req, res);
  } catch (err) {
    console.error('[/api/generate-model]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

const TRIPO_KEY = process.env.TRIPO_API_KEY || '';
const MESHY_KEY = process.env.MESHY_API_KEY || '';
const HUNYUAN_KEY = process.env.HUNYUAN_API_KEY || '';

app.listen(PORT, () => {
  console.log(`\n🚀 Orbital API  ->  http://localhost:${PORT}`);
  console.log(`   Model        ->  ${MODEL} (Gemini)`);
  console.log(`   Key loaded   ->  ${GEMINI_KEY ? 'YES' : 'NO - check .env'}`);
  console.log(`   3D Gen keys  ->  Tripo:${TRIPO_KEY ? '✓' : '✗'}  Meshy:${MESHY_KEY ? '✓' : '✗'}  Hunyuan:${HUNYUAN_KEY ? '✓' : '✗'}\n`);
});
// Prevent the process from exiting if there are no other event listeners
process.stdin.resume();
