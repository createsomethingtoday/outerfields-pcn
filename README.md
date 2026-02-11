# Outerfields PCN

Premium Content Network — a private video streaming platform for creators and brands.

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5
- **Styling**: Tailwind CSS with custom Outerfields design tokens
- **Payments**: Stripe (checkout + webhooks)
- **Email**: Resend (transactional emails)
- **Scheduling**: Calendly (discovery calls)
- **AI**: Anthropic SDK (analytics chat)

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` (Replit will assign its own port via `--host`).

## Project Structure

```
src/
├── lib/
│   ├── components/     # 37 Svelte UI components
│   ├── constants/      # Navigation config
│   ├── email/          # Email templates and service
│   ├── server/         # Server-side logic (DB queries, guardrails)
│   ├── stores/         # Svelte stores (auth, video player, stats)
│   ├── types/          # TypeScript types
│   └── utils/          # Client utilities (event tracking, video gating)
├── routes/
│   ├── api/            # ~20 API endpoints
│   ├── watch/[id]/     # Video watch pages
│   ├── admin/          # Admin panel
│   ├── login/          # Auth pages
│   ├── signup/
│   └── ...             # Landing, about, pricing, etc.
├── app.css             # Design system tokens + base styles
├── app.html            # HTML shell
└── hooks.server.ts     # Auth middleware (session handling)
```

## Migration Status: Cloudflare → Replit

This project was extracted from a Cloudflare Pages deployment. The following bindings need portable replacements:

| Original (Cloudflare)  | Replacement Needed       | Status  |
|-------------------------|--------------------------|---------|
| D1 Database (`DB`)      | PostgreSQL / SQLite      | Pending |
| KV (`SESSIONS`)         | In-memory / Redis        | Pending |
| KV (`VIDEO_STATS`)      | PostgreSQL / Redis       | Pending |
| R2 (`VIDEO_ASSETS`)     | S3 / Supabase Storage    | Pending |
| Workers AI (`AI`)       | Anthropic SDK (already used) | ✅ Ready |

### What Works Now
- All UI components render correctly
- Tailwind + design system is fully self-contained
- Stripe, Resend, Calendly integrations are API-based (no Cloudflare dependency)

### What Needs Wiring
- Database: Replace `platform.env.DB` calls with a Postgres/SQLite client
- Sessions: Replace `platform.env.SESSIONS` (KV) with cookie sessions or a session store
- Video storage: Point to an external file host instead of R2
- Environment variables: Set via Replit Secrets instead of wrangler.toml

## Database Schema

Migration files are in `migrations/`. The schema includes:
- `users` — accounts, membership status, Stripe customer ID
- `videos` — catalog with categories, tiers (free/preview/gated)
- `discovery_calls` — Calendly booking tracking
- `comments` — video comments
- `transcripts` — video transcripts
- `user_events` — analytics events
- `agent_proposals` — AI-generated proposals

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys. On Replit, use the Secrets tab.

## Original Deployment

The Cloudflare config files (`wrangler.toml`, `wrangler.jsonc`, `worker-configuration.d.ts`) are kept for reference but are not used in the Replit deployment.
