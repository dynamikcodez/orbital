/**
 * Claude service wrapper.
 * Sends requests to the Express backend (/api/interview or /api/archetypes).
 * The Express server injects the ANTHROPIC_API_KEY server-side.
 */

const API_BASE = '/api';

/**
 * Send the mission description + conversation history to Claude.
 * Returns the parsed JSON from Claude (SatelliteDesign or { interviewStatus, pendingQuestions }).
 */
export async function sendInterview({ missionDescription, archetypeId, history }) {
  const res = await fetch(`${API_BASE}/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionDescription, archetypeId, history }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Interview API error ${res.status}: ${err}`);
  }
  return res.json();
}

/**
 * Fetch all 5 archetype cards from Claude (for gallery bootstrapping).
 */
export async function fetchArchetypes() {
  const res = await fetch(`${API_BASE}/archetypes`, { method: 'POST' });
  if (!res.ok) throw new Error('Archetypes API error ' + res.status);
  return res.json();
}
