
Rough notes on how I broke down the problem, experimented, course-corrected when the models went off track, and decided on architecture tradeoffs.

---

### 1. Problem Breakdown & Core Thesis

When reading the brief, two things stood out:
1. **Noise vs Signal**: Most finance feeds just dump exchange disclosures in reverse chronological order. A quarterly result announcement is useless if an investor still has to download the PDF just to see if PAT grew or collapsed YoY.
2. **Network cannot be a siloed contact book**: If "Network" is just another tab where you scroll through names, nobody uses it. It has to pop up proactively when looking at an event ("RIL acquired Shubhalakshmi Polyesters -> oh wait, Vikram in my network used to work in petrochemicals there").

So the core interaction model had to be:
- **Push**: Filtered feed where results cards immediately show the 4 headline metrics (Revenue, EBITDA, PBT, PAT) with QoQ and YoY, plus inline network tags.
- **Pull**: On-demand deep dive strictly anchored on primary numbers (P&L, balance sheet leverage, cash flow conversion).
- **Network**: Both an interactive visual map and an in-memory scoring engine that tags people to companies, sectors, and past employers.

---

### 2. Prompting Strategy & Where Models Went Wrong

I used LLMs (Claude & GPT) to brainstorm component structures and accelerate boilerplate writing, but had to heavily intervene and rewrite several parts:

#### Issue 1: Model hallucinating broker commentary in "Pull"
- **What happened**: When I asked the model to structure the company research view, it initially tried to pull in "general analyst consensus", "macro market sentiment", and generic P/E valuations from pre-trained knowledge.
- **Course correction**: The brief explicitly forbade outside commentary or model hallucinations. I wiped that prompt output and wrote a strict deterministic data schema for `financials` in SQLite. All percentage changes (YoY, QoQ), EBITDA margins, D/E ratios, and Cash Conversion rates are computed directly in JS (`src/lib/llm.js` & `src/lib/network.js`). The LLM is only fed the exact primary numbers as context for structured summarisation.
- **Fallback**: Added a pure JS fallback generator (`buildFallbackAnalysis`) so the entire prototype runs 100% offline without needing any API key.

#### Issue 2: D3 SVG vs HTML5 Canvas for the Network Map
- **What happened**: The model generated a standard D3 force-directed SVG graph for the network view. In desktop browser testing it looked okay, but the moment I simulated touch interactions on mobile, SVG DOM node dragging was choppy and node labels overlapped horribly on 390px screens.
- **Course correction**: Scrapped the D3 SVG component. Rewrote it in `NetworkGraph.jsx` using raw HTML5 Canvas with a fixed radial layout (User in center, concentric rings for contact strength, dashed arcs between 2nd-degree connections). Canvas render is instant (60fps) and touch/click hit testing is handled with simple Euclidean distance calculations.

#### Issue 3: Disconnected Network UI
- **What happened**: First pass had Network as an isolated screen. Push cards had no reference to people.
- **Course correction**: Realized this missed the entire premise of FINN. Built `findRelevantContacts()` in `src/lib/network.js` which scores contacts based on:
  - Current company match (10 pts)
  - Prior company history (7 pts)
  - Sector match (5 pts)
  - Topic/expertise keyword overlap (3 pts)
  - Relationship strength (1-5 pts)
  Then surfaced these as interactive badges directly on Push cards and in the Pull diligence tabs.

#### Issue 4: UI Slop & Bloat
- **What happened**: Standard LLM-generated UI templates always default to generic Tailwind dashboards with massive white cards, huge margins, and low information density.
- **Course correction**: Ditched the generated template styles. Wrote custom CSS (`globals.css`) constrained to 430px mobile width, high-contrast dark theme, dense financial tables, colored badge tags for exchange announcement categories, and fixed bottom navigation.

---

### 3. Decisions & Tradeoffs

| Choice | Why | Tradeoff |
|---|---|---|
| **SQLite (`better-sqlite3`)** | Zero-config, zero latency, self-contained single file (`finn.db`). Anyone can clone and run immediately. | Single-user only. For multi-tenant prod, will migrate schema to Postgres. |
| **Next.js App Router** | Unified frontend + API routes in one process. | Need to handle Turbopack / serverExternalPackages for native SQLite bindings. |
| **Heuristic Contact Matching** | Fast, deterministic in-memory scoring across past companies and expertise. | Doesn't capture subtle semantic connections; can layer vector embeddings on contact notes in future iterations. |
| **Local Privacy Guardrail** | Contacts and network notes are kept on-prem / in local DB and never transmitted to LLM API endpoints. | LLM can't directly reason over full private contact dossiers (by design). |

---

### 4. What I'd Do With More Time

1. **BSE/NSE Scraper Cron**: Hook up live RSS / API polling from `bseindia.com` into the `announcements` table with automatic deduplication.
2. **Audio/Concall Transcript Parser**: Chunk earnings call transcripts into guidance vs actuals tables to automate the "Promise vs Reality" multi-quarter tracking.
3. **Contact Sync**: CSV / vCard import for an investor's real address book + LinkedIn export parser to map past company history automatically.

Also I used AI for creative formal and structured writing of md files.
