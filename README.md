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
| D1 Database (`DB`)      | PostgreSQL / SQLite      | ✅ Ready (set `DATABASE_URL` for Neon/Postgres) |
| KV (`SESSIONS`)         | In-memory / Redis        | Pending |
| KV (`VIDEO_STATS`)      | PostgreSQL / Redis       | Pending |
| R2 (`VIDEO_ASSETS`)     | S3 / Supabase Storage    | Pending |
| Workers AI (`AI`)       | Anthropic SDK (already used) | ✅ Ready |

### What Works Now
- All UI components render correctly
- Tailwind + design system is fully self-contained
- Stripe, Resend, Calendly integrations are API-based (no Cloudflare dependency)

### What Needs Wiring
- Database: Set `DATABASE_URL` in Replit Secrets (e.g. Neon Postgres) to use Postgres; otherwise SQLite is used
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

## Video CDN (R2) configuration

Videos are loaded from a CDN base URL set by `PUBLIC_VIDEO_CDN_BASE` (see `.env.example`). For playback to work in all major browsers (including seeking), the CDN (e.g. Cloudflare R2 public bucket or custom domain) **must** send:

- **CORS:** `Access-Control-Allow-Origin` (your site origin or `*` for testing); preferably also `Access-Control-Allow-Methods: GET, HEAD, OPTIONS` and `Access-Control-Expose-Headers: Content-Range`.
- **Range requests:** `Accept-Ranges: bytes` so the player can seek.
- **Content-Type:** `video/mp4` for MP4 files.

**Recommended format:** H.264 (AVC) video in an MP4 container, with AAC audio. This is supported everywhere; avoid relying on WebM/VP9 or AV1 for Safari.

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys. On Replit, use the **Secrets** tab.

- **DATABASE_URL**: Set to your Neon (or other) Postgres URL to use Postgres. If unset, the app uses SQLite at `data/outerfields.db`. Example: `postgresql://user:password@host/dbname?sslmode=require`

## Best setup: Replit + Neon Postgres (research-backed)

- **Single source of truth for credentials**  
  Get the production connection string from **[Neon Console](https://console.neon.tech)** → your project → **Connect** → copy the connection string. Put that **exact** value in Replit **Production app secrets** as `DATABASE_URL`. If you ever get “password authentication failed”, **reset the password in Neon Console** and update the same string in Replit (and use the new password locally for scripts). That way Replit and local always use known-good credentials.

- **Production (Replit)**  
  - Use one variable: `DATABASE_URL` (full Postgres URL).  
  - For high concurrency, use Neon’s **pooled** connection string (hostname contains `-pooler`) in Production secrets.  
  - In Neon, for the **production** branch: turn off **Scale to zero** to avoid cold starts; set **Autoscaling** (e.g. 1–4 Compute Units).

- **Local development**  
  - Keep **SQLite** when `DATABASE_URL` is unset (fast, offline).  
  - When you need to load data into Neon (e.g. for production), run `npm run db:push` with `DATABASE_URL` (or `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`) set to the **same** connection string you use in Replit (from Neon Console).

- **Replit dev vs prod**  
  Replit can create a **separate production database** for deployments and sync schema at deploy time. If you use that flow, you can also use **“Copy your development database to production database”** in the Replit **Publishing** tab to copy data from the Replit dev DB to the Replit prod DB instead of pushing from local SQLite.

- **SSL**  
  Neon requires SSL. Use `?sslmode=require` or `?sslmode=verify-full` in the URL; the app and `db:push` script already use secure SSL.

### Pushing local SQLite data to Postgres

To copy data from your local SQLite DB into Postgres (e.g. before or after deploying to Replit):

```bash
export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
npm run db:push
```

Source: `data/outerfields.db` (or `DATABASE_PATH`). Target: the Postgres URL in `DATABASE_URL`. Existing rows in Postgres are left unchanged (`ON CONFLICT DO NOTHING`).

## Original Deployment

The Cloudflare config files (`wrangler.toml`, `wrangler.jsonc`, `worker-configuration.d.ts`) are kept for reference but are not used in the Replit deployment.
