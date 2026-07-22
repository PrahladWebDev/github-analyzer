# GitHub Personality Analyzer

Enter any GitHub username and get a "developer personality" report: profile stats,
personality badges, language breakdown, a commit heatmap, top repos, and an
AI-written summary (powered by Google's Gemini free tier). Includes a compare
mode for two developers side by side.

### ✨ Recently added

- **Light/dark theme toggle** — switch themes from the header button; preference
  is remembered (`localStorage`) and respects the system theme on first visit.
  The whole palette is CSS-variable driven so all existing cards/charts adapt.
- **Export report as image** — "🖼️ Export as image" renders the profile card,
  badges, charts, and repo list to a downloadable PNG via `html2canvas`.
- **Copy as Markdown** — alongside the plain-text share summary, a
  "📄 Copy as Markdown" button copies a README-ready snippet with badges and stats.
- **Per-repo personality tags** — each top repo now shows tags like
  "📖 Well documented", "🚀 Popular", "⚡ Actively maintained", "🕸️ Stale", or
  "🍴 Fork magnet", computed client-side from data already returned by the API.
- **Streak badges** — the commit heatmap's longest-streak calculation now feeds
  a badge ("🔥 Consistent Committer" / "On a Streak" / "Unstoppable" at 7/14/30+
  days) instead of only showing up in the heatmap tooltip.
- **Animated three.js background** — an ambient constellation/graph of drifting,
  connecting nodes rendered behind the whole app in the GitHub blue/green palette.
  Subtle mouse parallax, pauses on hidden tabs, and respects `prefers-reduced-motion`.
- **Commit Rhythm chart** — hour-of-day and day-of-week bar charts built from the
  push-event time distribution the backend already computed but the UI never showed.
- **Personality Radar** — a 6-axis radar chart (open source score, docs, night owl,
  early bird, weekend activity, bug hunting) for an at-a-glance shape of a profile.
- **Recent searches** — the last 8 usernames you looked up are saved locally
  (`localStorage`) as quick-access chips under the search bar.
- **Copy shareable summary** — one click copies a plain-text recap of the report
  (stats, top languages, badges, scores) to the clipboard.
- Subtle fade-in-up entrance animation on report cards.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + Chart.js
- **Backend:** Node.js + Express
- **APIs:** GitHub REST API + GitHub Search API, Gemini API (`gemini-2.0-flash`)
- Caching: in-memory (`node-cache`), 15 min TTL, to stay within GitHub's rate limits

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
GITHUB_TOKEN=your_github_personal_access_token   # optional but recommended, no scopes needed
GEMINI_API_KEY=your_gemini_api_key                # required for AI summary/roast
GEMINI_MODEL=gemini-2.0-flash
CLIENT_URL=http://localhost:5173
```

- Get a GitHub token (classic, no scopes) at https://github.com/settings/tokens — this raises your
  GitHub API limit from 60/hr to 5000/hr. Without it the app still works for light usage.
- Get a free Gemini API key at https://aistudio.google.com/app/apikey.

```bash
npm install
npm run dev      # nodemon, or `npm start` for plain node
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` calls to the backend.

## API endpoints

- `GET /api/github/analyze/:username` — full profile + stats + badges + languages + heatmap
- `GET /api/github/analyze/:username?deep=true` — same, but pulls real per-repo byte counts for languages (slower, more accurate)
- `GET /api/github/compare/:userA/:userB` — both users' analysis in one response
- `GET /api/ai/summary/:username` — Gemini-generated personality summary
- `GET /api/ai/roast/:username` — optional light-hearted roast
- `GET /api/ai/compare-verdict/:userA/:userB` — Gemini verdict comparing two developers

## Notes on data accuracy

- **Commit heatmap / night-owl / early-bird badges** are derived from the GitHub Events API,
  which only exposes a rolling ~90 days of public activity (a hard GitHub limitation, not
  configurable). This is a good sample for personality inference, but not a full history.
- **Bug fix ratio** uses the Search API (`author:<user> type:pr label:bug`) as an approximation —
  it depends on repos actually using a "bug" label.
- **Language breakdown** defaults to counting each repo's primary language (fast, low API usage).
  Pass `?deep=true` to fetch real byte-level breakdowns for the top 15 starred repos instead.

## Deploying (matches a typical PM2 + Nginx setup)

```bash
# Backend
cd backend && npm install --production
pm2 start server.js --name github-personality-api

# Frontend
cd frontend && npm install && npm run build
# serve the `dist/` folder via Nginx, proxying /api to the PM2 process
```

## Roadmap ideas not yet built

- Persisting analyses to MongoDB for history/leaderboards
- Redis caching layer instead of in-memory cache (for multi-instance deployment)
- GraphQL-based full contribution calendar (needs OAuth or a broader-scoped token)
