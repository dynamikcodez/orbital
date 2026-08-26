import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

// Placeholder route for Claude wrapper
app.post('/api/claude', async (req: Request, res: Response) => {
  // In real implementation, forward request to Claude API
  res.status(501).json({ error: 'Claude service not implemented yet' });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server listening on http://localhost:${PORT}`);
});
