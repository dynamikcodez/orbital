import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

// Model to use via OpenRouter — claude-sonnet-4-5 as specified
const MODEL = 'anthropic/claude-sonnet-4-5';

app.use(cors({ origin: true }));
app.use(express.json());

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert Space Systems Engineering AI for a platform called Orbital.
You operate in two modes: INTERVIEW and DESIGN.

### MODE 1 — INTERVIEW
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

### MODE 2 — DESIGN
Triggered when interviewStatus is COMPLETE.
Return ONLY valid JSON. No prose outside the JSON object.

ENGINEERING RULES:
- Mass, power, and cost budgets must be internally consistent.
- Surface all assumptions in missionProfile.assumptions array.
- Eclipse margin must be positive. Flag powerBalance.status as "Critical" if below 10%.
- Express all costs as min/mid/max ranges, never single figures.
- Generate exactly 2 tradeOffVariants: one cost-optimized, one mass-optimized.
- Each subsystem must include a one-sentence educationNote written for a technically curious non-engineer.

Full SatelliteDesign JSON schema:
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
          "specifications": { [key: string]: string|number },
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

// ── OpenRouter helper ──────────────────────────────────────────────────────
async function callOpenRouter(messages) {
  if (!OPENROUTER_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in .env');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Orbital - AI Satellite Engineering',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 8192,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '';

  if (!raw) throw new Error('Empty response from model');

  // Strip markdown code fences if present
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Model returned non-JSON (should not happen) — wrap it
    console.error('Non-JSON response from model:\n', raw);
    throw new Error('Model returned non-JSON. Raw: ' + raw.slice(0, 200));
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────

// POST /api/interview  — first message or continuation
app.post('/api/interview', async (req, res) => {
  try {
    const { missionDescription, archetypeId, history = [] } = req.body;

    const systemCtx = archetypeId
      ? `The user has pre-selected the "${archetypeId}" satellite archetype.`
      : '';

    // If no history yet, build the opening user message
    let messages;
    if (history.length === 0) {
      messages = [
        {
          role: 'user',
          content: `${systemCtx ? systemCtx + '\n\n' : ''}Mission description: ${missionDescription}`,
        },
      ];
    } else {
      messages = history;
    }

    const result = await callOpenRouter(messages);
    res.json(result);
  } catch (err) {
    console.error('[/api/interview]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interview/answer  — subsequent user answers
app.post('/api/interview/answer', async (req, res) => {
  try {
    const { history = [], answer } = req.body;
    const messages = [...history, { role: 'user', content: answer }];
    const result = await callOpenRouter(messages);
    res.json(result);
  } catch (err) {
    console.error('[/api/interview/answer]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/archetypes — static for MVP
app.post('/api/archetypes', (_req, res) => {
  res.json({ message: 'Archetypes served statically in the frontend for MVP.' });
});

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, keyLoaded: !!OPENROUTER_KEY });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Orbital API  →  http://localhost:${PORT}`);
  console.log(`   Model        →  ${MODEL}`);
  console.log(`   Key loaded   →  ${OPENROUTER_KEY ? 'YES ✓' : 'NO ✗ — check .env'}\n`);
});
