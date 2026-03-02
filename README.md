# AstroLogic

AstroLogic is a scientific Vedic astrology SaaS built with Next.js and Swiss Ephemeris.

The app now uses a **profile-centric Kundli model**:
- one main profile per account,
- up to 3 linked profiles (`partner` / `child`),
- persisted Kundli records per profile,
- ad-hoc calculations stored locally in browser history only.

## Core Flows

### 1) Ad-hoc calculate (public)
- Route: `/calculate`
- No login required
- `POST /api/calculate` computes planetary positions only
- Results are saved to local browser history (`astrologic.adHocHistory.v1`)
- Local history routes:
  - `/guest-charts`
  - `/guest-charts/:id`

### 2) Profile-based Kundli (authenticated)
- Routes:
  - `/profile`
  - `/profile/linked`
  - `/kundli/main`
  - `/kundli/linked/:id`
- Profile updates persist to Supabase
- Kundli is recomputed **on-demand on read** if stale or missing

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind + shadcn/ui
- Swiss Ephemeris via `@swisseph/node`
- Clerk for auth
- Supabase Postgres for server data
- Stripe + PostHog integrations remain in codebase

## Database

Run migrations before using profile/kundli features:

```bash
supabase db push
```

Migration files:
- `supabase/migrations/20260302080000_next_release.sql`
- `supabase/migrations/20260302100000_profile_kundli.sql`
- `supabase/migrations/20260302101000_deprecate_legacy_charts.sql`

## Environment Variables

Copy template:

```bash
cp .env.example .env.local
```

Important variables:
- Clerk:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Google Maps (Places autocomplete):
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## API Routes (current)

- `POST /api/calculate` (ad-hoc compute, no DB writes)
- `GET /api/profile/main`
- `PUT /api/profile/main`
- `GET /api/profile/linked`
- `POST /api/profile/linked`
- `GET /api/profile/linked/:id`
- `PUT /api/profile/linked/:id`
- `DELETE /api/profile/linked/:id`
- `GET /api/kundli/main`
- `GET /api/kundli/linked/:id`

Deprecated:
- `/api/charts*` now returns deprecation response

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment

Deployment target is **Vercel**.

Configure environment variables in both Preview and Production environments.
