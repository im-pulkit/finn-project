# FINN — Financial Investment Agent

A mobile-first financial intelligence tool for public-market investors. FINN filters noise from signal across announcements, filings, and your own professional network.

## What it does

Three modes:

- **Push** — proactive feed of what changed and why you should care. Filters announcements by category, shows headline numbers for results, surfaces management changes with bios, and tells you who in your network is relevant to each event.
- **Pull** — on-demand company research grounded in primary data (filings + transcripts, not news/broker notes). Shows financial snapshot (Revenue, EBITDA, PBT, PAT with QoQ/YoY), balance sheet health, cash quality, bull/bear framing, and a narrative-vs-numbers check.
- **Network** — the intelligence layer. An interactive graph of your contacts mapped by sector, company history, and expertise. Surfaces "who should I call" for any company or event, flags second-degree connections, and nudges you to reconnect when a contact's company has news.

Network isn't a separate tab bolted on — it shows up inside Push cards (who do I know at this company?) and Pull views (who can help me understand these numbers?).

## Quick start

```bash
npm install
npm run seed     # populates sqlite with sample data
npm run dev      # localhost:3000
```

Needs Node 18+. No API keys required for the prototype — the fallback analysis engine works without OpenAI. To enable LLM-powered analysis, set `OPENAI_API_KEY` in `.env`.

## Tech decisions

**Why Next.js + SQLite**: I wanted a single deployable with zero infra. Next.js API routes let me colocate the backend without spinning up a separate server. SQLite via `better-sqlite3` is fast, zero-config, and good enough for a single-user prototype. In production this becomes Postgres.

**Why not a component library**: The brief said "no AI slop" and penalizes generic templates. I wrote the CSS from scratch — dark theme, dense layout, designed for a 430px phone viewport. Tailwind for utility classes, custom CSS variables for the design system.

**LLM routing**: The Pull analysis uses GPT-4o-mini (cheap, fast, good enough for structured extraction) with a fallback that does the math directly when the API is unavailable. In production I'd route: 4o-mini for bulk extraction and summarisation, a stronger model only for the narrative-vs-numbers reasoning that actually needs it.

**Why canvas for the network graph**: D3 in SVG gets slow with touch interactions on mobile. A canvas-based graph with manual hit detection is snappier. The tradeoff is accessibility — a production version would need an accessible alternative view.

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Mobile UI                   │
│         (Next.js React, CSS, Canvas)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │   Push   │ │   Pull   │ │   Network    │ │
│  │   Feed   │ │ Research │ │   Graph +    │ │
│  │          │ │          │ │   Search     │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
└───────┼────────────┼───────────────┼─────────┘
        │            │               │
   ┌────▼────────────▼───────────────▼────┐
   │          API Routes (Next.js)         │
   │  /api/push  /api/pull  /api/network   │
   └────┬──────────┬──────────────┬────────┘
        │          │              │
   ┌────▼──────────▼──────────────▼────┐
   │           Business Logic           │
   │  ┌─────────┐ ┌──────┐ ┌────────┐  │
   │  │ network │ │ llm  │ │   db   │  │
   │  │ .js     │ │ .js  │ │  .js   │  │
   │  └─────────┘ └──────┘ └────────┘  │
   └──────────────────┬────────────────┘
                      │
              ┌───────▼───────┐
              │   SQLite DB   │
              │  (finn.db)    │
              └───────────────┘
```

### Data pipelines

**Push feed**: In production, a cron job polls BSE/NSE announcement APIs every 5 minutes. Announcements are classified into categories (results, management_change, M&A, litigation, etc.), scored for importance, and stored. The classification can use a cheap LLM call or keyword rules — most categories are identifiable from the announcement subject line. For the prototype, the seed script populates realistic sample announcements.

**Pull analysis**: When a user taps a company, the API fetches financials from the DB (in production: scraped from screener.in or the company's exchange filings), runs them through the analysis pipeline (LLM for narrative, direct computation for ratios), and caches the result for 60 minutes. Primary data only — no broker notes, no news.

**Network matching**: Contacts are stored with current company, previous companies, sector, and expertise tags. When an announcement comes in, the system does a multi-signal match: direct company match (10 points), previous company (7), sector (5), expertise keyword (3), plus relationship strength. This runs in-memory — fast enough for hundreds of contacts.

### Data security & privacy

The network contains personal information. Key decisions:

- **All network data stays local to the user's instance**. No shared database of contacts across users. Each user's network is their own SQLite file.
- **No PII sent to LLMs**. The analysis pipeline sends only financial numbers and company names to the model. Contact names, relationship details, and notes never leave the device/server.
- **In production**: contacts would be encrypted at rest, access gated by auth (JWT + refresh tokens), and the network DB would be a per-user encrypted partition. GDPR/consent: contacts can be added but the system only stores what the user explicitly provides — no scraping LinkedIn without consent.
- **Retention**: financial data is ephemeral (cache TTL 60 min for analysis, 24h for announcements). Network data persists until the user deletes it.

### Use of LLMs

| Step | Model | Why |
|------|-------|-----|
| Pull — financial analysis | GPT-4o-mini | Structured extraction and summarisation of numbers. Cheap (~$0.001 per analysis). Fast. |
| Pull — narrative vs numbers | GPT-4o (production) | Needs reasoning to compare management guidance against delivered numbers. Worth the cost for this specific step. |
| Push — announcement classification | Rules-based (production: 4o-mini fallback) | Most categories are identifiable from keywords. LLM only for ambiguous cases. |
| Network — matching | No LLM | Deterministic scoring. Fast, predictable, no cost. |

**Fallback**: Every LLM call has a fallback that computes the answer directly from the numbers. The prototype works fully without an API key.

**Cost estimate**: At 100 Pull analyses/day on 4o-mini, cost is ~$0.10/day. The expensive model is only called for the narrative analysis — maybe 10 calls/day at ~$0.05 each. Total: <$1/day.

### Cloud services (production)

- **Vercel** for the Next.js frontend + API routes (serverless, auto-scaling)
- **Supabase/Neon** for Postgres (replacing SQLite)
- **Redis** for caching analysis results and rate limiting
- **Cron via Vercel** or a small Cloud Run job for polling BSE/NSE announcements
- Could run the whole thing on a single $5/mo VPS for a single-user deployment

## What I deliberately left out

- **Real BSE/NSE API integration**: The prototype uses seeded data. In production I'd poll the BSE API (`api.bseindia.com`) and parse the XML/JSON feeds. The data model is ready for it.
- **Screener.in scraping**: Would use cheerio to pull annual report links and standardised financials. The Pull analysis is structured to consume this data.
- **Voice / chat interface**: The brief mentions experimenting with interaction models. I focused on getting the dense, mobile-first card UI right first. A voice layer (Whisper + TTS) would sit on top of the same API.
- **Real-time prices**: Would use Yahoo Finance API for EOD data. Easy to add but not core to the prototype.
- **Authentication**: Skipped for the prototype. In production: NextAuth with email magic links or Google OAuth.
- **Push notifications**: Would use web push or a React Native wrapper for actual mobile push.

## What I'd build next

1. **Earnings call transcript analysis** — pipe concall transcripts through the LLM to extract guidance commitments, then track them quarter over quarter. This is the "narrative vs numbers" view the brief describes.
2. **Network graph evolution** — show how your network's relevance changes as your watchlist evolves. If you add a pharma company, surface that your college friend now works at a pharma distributor.
3. **Collaborative network** — let multiple investors at the same firm share network intelligence (with permissions). The "who do we collectively know" question.
4. **Smart digest** — a morning briefing that's 5 items max, ranked by what actually matters to your portfolio and watchlist. Not 50 announcements — 5.

## Structure

```
finn/
├── src/
│   ├── app/
│   │   ├── layout.js, page.js, globals.css
│   │   ├── pull/page.js
│   │   ├── network/page.js
│   │   └── api/
│   │       ├── push/route.js
│   │       ├── pull/route.js
│   │       └── network/route.js
│   ├── components/
│   │   ├── Nav.jsx
│   │   ├── PushCard.jsx
│   │   ├── PullView.jsx
│   │   └── NetworkGraph.jsx
│   ├── lib/
│   │   ├── db.js          # sqlite setup
│   │   ├── llm.js         # openai + fallback
│   │   └── network.js     # contact matching
│   └── data/
│       ├── seed.js
│       ├── contacts.json
│       └── watchlist.json
├── finn.db                 # generated by seed
├── .env.example
└── package.json
```
