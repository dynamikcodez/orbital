// Vercel serverless function: POST /api/interview
// Handles both the first message and follow-up answers in one endpoint.

import { callGemini } from './_lib/openrouter.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { missionDescription, archetypeId, history = [] } = req.body;

    let messages;

    if (history.length === 0) {
      // First message — build opening user message from mission description
      const systemCtx = archetypeId
        ? `The user has pre-selected the "${archetypeId}" satellite archetype.\n\n`
        : '';
      messages = [
        { role: 'user', content: `${systemCtx}Mission description: ${missionDescription}` },
      ];
    } else {
      // Continuation — use provided history directly
      messages = history;
    }

    const result = await callGemini(messages);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[/api/interview]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
