# AstroLogic

AstroLogic is an open-source, scientific Vedic astrology SaaS MVP built with Next.js and Swiss Ephemeris. Instead of generic horoscope text, it computes auditable sidereal planetary positions and displays transparent astronomical results.

## MVP Scope

- Modern landing page with scientific positioning.
- `/calculate` workflow with strict form validation.
- `POST /api/calculate` calculation endpoint.
- Sidereal (Lahiri) longitudes + retrograde state for:
  - Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu (True Node), Ketu.
- Derived Rashi and Nakshatra mapping.
- Results rendered as structured data table + optional raw JSON.

Out of scope for this MVP:

- AI interpretation generation.
- User chart persistence in Supabase.
- Auth/paywall enforcement (Clerk/Stripe are scaffolded only).

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript (strict)
- Styling/UI: Tailwind CSS + shadcn/ui throughout the app
- Astrology engine: `@swisseph/node` (Swiss Ephemeris native bindings)
- Validation: `zod`, `react-hook-form`
- SaaS integrations (scaffolded): Clerk, Supabase, Stripe
- Testing: Vitest + Testing Library
- Deployment target: Vercel

## Project Structure

```text
src/
  app/
    api/calculate/route.ts
    calculate/page.tsx
    page.tsx
  components/
    calculate/calculate-form-client.tsx
    ui/* (shadcn components)
  lib/
    astrology/
      calculate-engine.ts
      constants.ts
      math.ts
      time.ts
      types.ts
    clients/
      clerk.ts
      supabase.ts
      stripe.ts
    validation/
      calculate.ts
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

Create `.env.local` with the following values:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
```

Notes:

- MVP calculator does not require these keys to compute chart results.
- These values are scaffolded for future auth, persistence, and billing work.

## Scripts

- `npm run dev` - Start local development server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run test` - Run Vitest with coverage
- `npm run test:watch` - Run Vitest in watch mode
- `npm run build` - Build production app
- `npm run start` - Start production server

## API Contract

### `POST /api/calculate`

Request body:

```json
{
  "fullName": "Aarav Sharma",
  "dateOfBirth": "1995-08-17",
  "timeOfBirth": "14:30",
  "timezone": "Asia/Kolkata",
  "latitude": 19.076,
  "longitude": 72.8777
}
```

Response body (shape):

```json
{
  "metadata": {
    "fullName": "Aarav Sharma",
    "dateOfBirth": "1995-08-17",
    "timeOfBirth": "14:30",
    "timezone": "Asia/Kolkata",
    "latitude": 19.076,
    "longitude": 72.8777,
    "utcDateTime": "1995-08-17T09:00:00.000Z",
    "jdUt": 2449946.875,
    "siderealMode": "Lahiri",
    "ayanamsa": 23.7
  },
  "bodies": [
    {
      "key": "sun",
      "name": "Sun",
      "longitude": 120.123456,
      "longitudeDms": "120 deg 7' 24.44\"",
      "retrograde": false,
      "rashi": "Karka (Cancer)",
      "nakshatra": "Pushya"
    }
  ]
}
```

## Timezone and Julian Day Handling

- User enters local birth date/time plus required IANA timezone.
- Server converts local time to UTC using timezone rules (including DST).
- Julian Day is computed from UTC and used for Swiss Ephemeris calls.

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add all required environment variables in Vercel project settings.
4. Deploy.

Important: `src/app/api/calculate/route.ts` is configured with `runtime = "nodejs"`, which is required for native `@swisseph/node` bindings.

## Roadmap (Post-MVP)

- Multi-model AI interpretation layer.
- Clerk-authenticated chart history.
- Supabase persistence for charts.
- Stripe monetization (subscriptions/credits).
- Google Maps autocomplete for location capture.
