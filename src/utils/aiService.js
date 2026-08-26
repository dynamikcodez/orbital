export async function generateDesign(answers) {
  // Retrieve Gemini API key from Vite environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Build a concise prompt for the LLM to output JSON only.
  const prompt = `You are an aerospace engineer. Based on the following mission requirements, output a JSON object (no extra text) containing the keys: mission, payload, bus, totalCostUSD. Use realistic values.

Objective: ${answers.objective || 'Imaging'}
Region/Coverage: ${answers.region || 'Global'}
Resolution: ${answers.resolution || '0.5m'}
Revisit (hrs): ${answers.revisit || '12'}
Orbit: ${answers.orbit || 'Sun‑synchronous'}
Budget (USD): ${answers.budget || '5M'}`;

  // If no API key, return the static stub (same as before).
  if (!apiKey) {
    return staticStub(answers);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!response.ok) throw new Error('Gemini request failed');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('No text returned from Gemini');
    // Parse the JSON returned by the model.
    return JSON.parse(text);
  } catch (err) {
    console.warn('Gemini API error, falling back to stub:', err);
    return staticStub(answers);
  }
}

// Helper that returns the deterministic stub design.
function staticStub(answers) {
  return {
    mission: {
      objective: answers.objective || 'Imaging',
      region: answers.region || 'Global',
      revisitHours: answers.revisit || '12',
      orbit: answers.orbit || 'Sun‑synchronous',
    },
    payload: {
      type: 'Optical Imager',
      resolution: answers.resolution || '0.5m',
      massKg: 12,
      powerW: 30,
    },
    bus: {
      massKg: 40,
      powerW: 120,
      costUSD: 2500000,
    },
    totalCostUSD: 5200000,
    trade: null,
  };
}
