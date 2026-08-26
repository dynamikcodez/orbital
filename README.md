# Orbital — AI Satellite Engineering Platform

> Design a satellite in minutes, not months. Describe your mission in plain language — Orbital, our AI space systems engineer, asks 2–4 clarifying questions and generates a complete engineering design.

## What it does

| Step | What happens |
|------|-------------|
| 1 | Browse five satellite archetypes in the Discovery Gallery |
| 2 | Describe your mission in plain language |
| 3 | Orbital (Claude Sonnet via OpenRouter) asks clarifying questions one at a time |
| 4 | Receive a full engineering design: subsystems, Bill of Materials, power simulation, cost ranges, and two trade-off variants |

## Stack

- **Frontend** — React 19, Vite, React Router, vanilla CSS (dark mission-control theme)
- **AI** — Claude Sonnet 4.5 via [OpenRouter](https://openrouter.ai)
- **Backend (local dev)** — Express 5 (Node.js)
- **Backend (production)** — Vercel Serverless Functions (`/api`)

## Local development

### Prerequisites

- Node.js ≥ 18
- An [OpenRouter](https://openrouter.ai) API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/orbital.git
cd orbital

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env
# Edit .env and paste your OPENROUTER_API_KEY

# 4. Start both frontend and backend with one command
npm run dev
```

Vite will serve the frontend at **http://localhost:5173**.  
Express will serve the API at **http://localhost:4000**.  
The Vite dev server proxies `/api/*` to Express automatically.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Express together (uses `concurrently`) |
| `npm run dev:client` | Start Vite only |
| `npm run dev:server` | Start Express only |
| `npm run build` | Production build to `/dist` |

## Deployment (Vercel)

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/orbital)

### Manual steps

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Vercel auto-detects Vite. Build command: `npm run build`, output: `dist`.
4. Add your environment variable in Vercel dashboard:
   - `OPENROUTER_API_KEY` = your key
5. Deploy. Done.

The `/api` folder is auto-deployed as Vercel Serverless Functions — no server to manage.

## Project structure

```
orbital/
├── api/                        # Vercel serverless functions (production)
│   ├── _lib/
│   │   └── openrouter.js       # Shared OpenRouter helper + system prompt
│   ├── interview.js            # POST /api/interview
│   └── health.js               # GET /api/health
│
├── src/
│   ├── components/
│   │   ├── DiscoveryGallery.jsx   # Landing page — archetype cards
│   │   ├── MissionIntake.jsx      # Mission description + example prompts
│   │   ├── InterviewView.jsx      # Multi-turn AI conversation
│   │   └── DesignWorkspace.jsx    # Engineering design output (WIP)
│   ├── lib/
│   │   └── claude.js              # Frontend API client
│   ├── router/
│   │   └── AppRouter.jsx
│   ├── server/
│   │   └── index.js               # Express server (local dev only)
│   └── styles/
│       ├── design-tokens.css
│       └── globals.css
│
├── .env.example
├── vercel.json
└── vite.config.js
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `PORT` | No | Local Express port (default: 4000) |

## License

MIT
