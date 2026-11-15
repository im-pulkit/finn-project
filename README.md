# FINN

Mobile-first financial intelligence tool built for public market investors.

Most tools either spam you with 200 raw filings a day or give you generic summaries. FINN focuses on 3 things:
1. **Push**: High-signal feed (results, management exits, capex, M&A) with instant context (YoY/QoQ numbers, bio of incoming execs).
2. **Pull**: On-demand deep dive on a ticker using primary data only (P&L, balance sheet, cash conversion, bull/bear framing).
3. **Network**: Surfaces people in your own network who actually know about the company or the sector, woven directly into Push and Pull cards.

---

### Setup & Run

Node 18+ required.

```bash
npm install
npm run seed     # seeds sqlite db (finn.db) with sample filings & network contacts
npm run dev      # starts on http://localhost:3000
```

Best tested in mobile view (Chrome DevTools -> toggle mobile 390-430px) or directly on a phone.

*(Optional)* If you want live LLM analysis instead of the deterministic fallback engine, put your key in `.env`:
```
OPENAI_API_KEY=sk-...
```
The prototype runs completely fine without any API key.

---

### Key Decisions & Architecture

- **Next.js (App Router) + SQLite (`better-sqlite3`)**: Keeps everything in one repo with zero external infra dependencies to run the prototype. The DB runs locally as `finn.db`. In prod, this swaps to Postgres (Supabase/Neon).
- **Custom CSS over component libraries**: Kept it lightweight with a 430px centered mobile layout, custom dark palette, and minimal DOM. No bloated UI kit.
- **Canvas for Network Map**: Used HTML5 canvas instead of D3/SVG for the relationship graph because SVG nodes lagged heavily when testing mobile touch pan/drag.
- **LLM Routing & Primary Data Guardrail**:
  - Pure calculation (margins, YoY, QoQ, D/E ratio, cash conversion) is computed deterministically in code, not left to LLM hallucinations.
  - LLM (`gpt-4o-mini`) is only used for synthesizing narrative vs numbers and bull/bear arguments.
  - Fallback engine handles everything if offline or out of credits.
- **Privacy**: The user's network graph and contact notes are stored locally in SQLite and never sent to external LLM APIs. Only anonymized company tickers and raw filing numbers get passed to LLMs.

### What's Left Out / Next Steps
- Real BSE/NSE RSS scraper (data schema is ready, just needs the live cron).
- Concall audio/transcript parsing to automatically flag broken guidance across 4 quarters.
- Sharing network intelligence across team members at the same fund with granular privacy controls.
