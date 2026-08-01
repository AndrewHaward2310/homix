# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Ocean Park — a Next.js 16 (App Router) / React 19 marketing + portal app for a luxury real-estate platform, doubling as a living design system ("Apple Luxury Minimal" style). Full-stack: Next.js Route Handlers (`app/api/*`) backed by PostgreSQL via Prisma; JWT-cookie auth. Package manager is **pnpm**. Comments and UI copy are primarily in Vietnamese; match that when editing.

## Commands

```bash
pnpm dev          # next dev — local dev server
pnpm build        # next build (note: TS errors are ignored during build, see below)
pnpm start        # serve the production build
pnpm lint         # eslint .

# Database (needs Postgres up — see docker compose below)
docker compose up -d postgres   # Postgres on host port 5433 (avoids system pg on 5432)
pnpm db:migrate   # prisma migrate dev — create/apply migrations
pnpm db:seed      # seed DB from data/mock/* (all demo accounts, password 123456)
pnpm db:studio    # prisma studio — inspect data
pnpm db:generate  # regenerate Prisma Client after editing schema
```

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` — a green `pnpm build` does **not** mean the types are clean. Type-check explicitly with `pnpm exec tsc --noEmit` when correctness matters.
- **Vitest** for unit tests of pure logic (no DB/network): `pnpm test` (run once) / `pnpm test:watch`. Config in `vitest.config.mts`, tests in `tests/*.test.ts` (mappers BigInt→number, SEO JSON-LD/XSS, price/locale). No DB-backed or e2e tests yet.
- Path alias: `@/*` maps to the repo root (e.g. `@/components/...`, `@/lib/...`).

## Architecture

### Design system (the core of the repo)
- `lib/design-tokens.ts` is the documented source-of-truth object for colors/typography/spacing/radius/motion/glass, but **it is not consumed at runtime** — it mirrors the CSS variables. Actual styling flows through `app/globals.css`, which defines the tokens as CSS variables inside Tailwind v4's `@theme inline` block. Keep the two in sync when changing tokens.
- Tailwind **v4** (no `tailwind.config.js`) configured via PostCSS (`postcss.config.mjs`) and `@import 'tailwindcss'` in `globals.css`. shadcn is set to the `base-nova` style with `neutral` base color (`components.json`); UI primitives use `@base-ui/react` (not Radix). `cn()` in `lib/utils.ts` merges classes.
- `components/luxury/` holds the reusable design-system primitives (`Typography`, `Section`, `Container`, `Reveal`, `LuxuryButton`, `GlassNavbar`, `PropertyCard`, ...). `app/styleguide/page.tsx` is the rendered showcase/reference for these.
- `components/home/` composes marketing sections for the customer homepage; `components/ui/` holds shadcn-generated primitives.

### Routing & roles
- Three roles (`customer | host | agent`) defined in `lib/auth/types.ts`, each mapped to a home route via `ROLE_HOME` (`/`, `/host`, `/agent`).
- Every page wraps its content in `<ProtectedRoute allow={[...]}>` (`components/auth/protected-route.tsx`): unauthenticated → `/login`; wrong role → the user's own portal (no cross-role access).
- Auth is a **mock** in `components/auth/auth-context.tsx` — logs in against `DEMO_USERS`, persists the user to `localStorage`. Shared demo password is `123456`.

### i18n (custom, no next-intl)
Two distinct translation layers — don't conflate them:
- **Static UI strings** (buttons, labels): `locales/{vi,en}.json`, accessed via `useT()` / `useLocale()` from `lib/i18n/provider.tsx`. Locale set is registered in `lib/i18n/config.ts`. Adding a language = add `locales/<code>.json` + one entry in `LOCALES`; no component changes needed. Locale persists to `localStorage`.
- **Dynamic content** (property titles, amenity names): stored inline as `LocalizedText` (`{ vi, en, ko?, zh? }`) on the data objects, read via `pickLocale()` from `types/index.ts`.

### Backend (Route Handlers + Prisma + JWT)
- **Data contract is the invariant**: `types/index.ts` (Property, Tower, Booking, Lead, Perk, User) is the shape every API returns. Prisma models in `prisma/schema.prisma` mirror it but must NOT leak out — `lib/mappers.ts` converts each Prisma row to its domain type (handles `BigInt` price fields → `number`, JSONB `LocalizedText`, etc.). Every Route Handler serializes through these mappers.
- **DB access**: `lib/db.ts` exports a singleton `prisma`. `LocalizedText` (title/description/name) is stored as JSONB; VND prices as `BigInt`.
- **Route Handlers** live under `app/api/*/route.ts`: `auth/{login,logout,me}`, `properties` (+`[id]`), `towers` (+`masterplan`), `perks`, `bookings` (GET scoped by role, POST computes `totalVnd` server-side — never trust client), `leads` (agent-only).
- **Auth**: JWT signed with `jose` (`lib/auth/jwt.ts`), stored in an httpOnly cookie `oceanpark_token`. `lib/auth/session.ts` is the server-side gate — `getSessionUser()`, and `requireUser()`/`requireRole()` which return the `User` or a `NextResponse` error (use `isResponse()` to branch). `middleware.ts` enforces role access on portal pages (`/`, `/host`, `/agent`) at the edge — it only verifies the JWT (no Prisma on edge); `ProtectedRoute` still guards client-side for UX. Passwords hashed with `bcryptjs`.
- **Service layer (`services/*`)**: client-side `fetch` wrappers (`propertyService`, `perkService`, `bookingService`, `leadService`, `userService`). Components call these — never `fetch` inline, never import `data/mock/*` directly. `propertyService` also holds the map constants (`MAP_DEFAULT_VIEW`, `MAP_STYLE_URL`) and `MasterplanTower` type.
- **`data/mock/*` is now seed-only**: the source for `prisma/seed.ts`, not consumed by the UI. Editing mock data only affects a re-seed.
- **Input validation**: `zod` schemas at the top of each handler that takes input.

### Maps
The masterplan locator (`components/home/masterplan/`) uses **maplibre-gl** against an external Vinhomes style URL (`MAP_STYLE_URL` in `propertyService.ts`); tower coordinates live in `MASTERPLAN_META` there.
