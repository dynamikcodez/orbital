// Vercel serverless function: GET /api/health
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    env: process.env.OPENROUTER_API_KEY ? 'key loaded' : 'MISSING KEY',
    ts: new Date().toISOString(),
  });
}
