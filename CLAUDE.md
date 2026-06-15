# CLAUDE.md — Smartpoint Cloud (SPC)

This file is the persistent context for every session building Smartpoint Cloud.
Read it fully before writing any code. Do not deviate from the constraints below without explicit instruction.

---

## What this product is

Smartpoint Cloud (SPC) is a professional travel agent desktop application.
It is not a consumer travel app. It is not a prototype. It is an enterprise-grade product that will eventually replace Travelport's existing agent desktop at scale, across 26,000 agencies and 150,000 agents globally.

The user is a trained travel agent. They know GDS workflows. They work at speed, often under client pressure, handling multiple PNRs simultaneously. The UI must respect that: no onboarding wizards, no hand-holding copy, no consumer UX patterns.

Every feature must be production-quality on first build. Enterprise-ready means: accessible, internationalised, tested, performant, and maintainable by a team, not just readable by the original author.

---

## What this product is not

- Not a rebuild of Smartpoint Desktop (legacy EDIFACT terminal). Do not replicate legacy patterns, cryptic command inputs, or terminal emulator UX unless explicitly instructed.
- Not a GDS rebuild. TripServices is the API layer. SPC is the product surface on top of it.
- Not a consumer booking flow. No checkout funnels, loyalty points copy, or consumer-facing marketing language in the UI.

---

## Primary API: TripServices

All data flows through TripServices. This is non-negotiable.

TripServices is Travelport's unified REST/JSON API platform. It covers:

- Air shopping and booking: EDIFACT, NDC, and LCC content via a single integration
- Trip lifecycle management: create, retrieve, modify, cancel, service
- Post-booking servicing: schedule changes, seat assignments, ancillaries, EMD
- Queue management: PNR queues, exception surfacing, workflow triggers
- Credentials and agency configuration: PCC, MCN-level provisioning
- Stays (Hotels): multi-step booking workflows including full payload and instant purchase
- Productivity Automator: AI co-pilot for queue management, auto-ticketing, quality control

**Current environment: pre-production sandbox.**

Auth token endpoint: `https://auth.pp.travelport.net/oauth/token`
Base URL: `https://api.pp.travelport.net/`
Format: REST/JSON throughout. No SOAP, no EDIFACT encoding at the SPC layer.

Auth: OAuth 2.0 client credentials. POST to the token endpoint with your client credentials to obtain a bearer token. Tokens are scoped per agency (MCN/PCC). Token refresh is handled in the shared auth module — do not reimplement per feature.

The sandbox mirrors production structure and behaviour. Build with confidence against it. When production credentials are confirmed, only `VITE_TRIPSERVICES_BASE_URL` and `VITE_TRIPSERVICES_AUTH_URL` in `.env.local` need to change — no code changes required.

When building any feature that requires data, identify the TripServices endpoint first.
Do not mock data unless the endpoint is explicitly flagged as not yet available — and flag that clearly in a comment.

### Key endpoint areas (confirm exact paths against OpenAPI spec)

| Domain | Operations |
|---|---|
| Trips | GET /trips, GET /trips/{id}, POST /trips, PATCH /trips/{id} |
| Search | POST /catalog-offerings-query (air shopping) |
| Orders | POST /order-create, POST /order-exchange, DELETE /order/{id} |
| Queues | GET /queues, GET /queues/{id}/entries, POST /queue-place |
| Seats | POST /seat-availability, POST /seat-assignment |
| Ancillaries | POST /ancillary-offers, POST /ancillary-booking |
| Passengers | POST /passengers, PATCH /passengers/{id} |
| Profiles | GET /profiles, GET /profiles/{id} |
| Agencies | GET /agencies/{mcn}, GET /pccs/{pcc} |

---

## Domain vocabulary

Use these terms precisely. Do not substitute with consumer or generic equivalents.

| Term | Meaning |
|---|---|
| PNR | Passenger Name Record — the core booking record in EDIFACT systems |
| Order | The NDC equivalent of a PNR. SPC must handle both. |
| Trip | TripServices' unified abstraction across PNR and Order |
| PCC | Pseudo City Code — sub-agency level identifier |
| MCN | Master Customer Number — home/agency level identifier |
| GWS | Travelport's legacy XML API (being deprecated; do not build against it) |
| uAPI | Legacy Universal API (also deprecated; do not build against it) |
| NDC | New Distribution Capability — IATA standard for airline direct content |
| EDIFACT | Legacy GDS booking standard. Most air content still lives here. |
| LCC | Low-Cost Carrier. Different content/booking model from traditional carriers. |
| Ancillary | Add-on to a booking: seat, bag, meal, lounge access, etc. |
| EMD | Electronic Miscellaneous Document — used to record ancillary transactions |
| Queue | A managed list of PNRs/Orders requiring agent action |
| Schedule change / SKDCHG | Involuntary itinerary change by the airline |
| Void | Cancellation of a ticket within the same day of issuance |
| Refund | Post-issuance ticket cancellation with fare calculation |
| Reissue | Exchange of an existing ticket for a new one |
| OSI | Other Service Information — free-text field on a PNR |
| SSR | Special Service Request — structured service request (WCHR, VGML, etc.) |
| Segment | A single flight leg within an itinerary |
| Itinerary | The full set of flight segments for a passenger or party |
| Passive segment | A non-GDS booking manually added to the PNR for record |
| Profile | Stored traveller preferences and document data |
| GCE | Global Content and Enablement — internal Travelport team |
| Productivity Automator | AI-powered queue and workflow automation product |

---

## Tech stack

### Confirmed

- **Framework:** React 18+ with TypeScript (strict mode, no `any`). Pinned to React **18.x** (not 19) to keep the shadcn/ui + React Testing Library ecosystem on its most-tested line.
- **State management:** Zustand for global state; React Query (TanStack Query v5) for server state and cache. *Not yet installed — add when the first feature needs them.*
- **Styling:** Tailwind CSS **v3** (config-based), utility classes only. No inline styles. No CSS modules unless for animation keyframes. Do **not** upgrade to Tailwind v4 — the SPC design system depends on `tailwind.config.ts` token mapping and shadcn CSS-variable overrides, which v4's CSS-first model removes.
- **Component library:** shadcn/ui (built on Radix UI primitives), configured manually (`components.json` present, `cn` helper in `src/lib/utils.ts`). Components live in `src/components/ui/` as owned source code — not a dependency. Add new ones with `npx shadcn@latest add <component>`. Extend them freely; do not create net-new primitives without flagging.
- **Testing:** Vitest **v3** + React Testing Library for unit/integration. Playwright for E2E. Vitest must be **v3+** so it shares the single Vite 6 install — Vitest 2.x pins Vite 5 and creates a duplicate-Vite type conflict that breaks `tsc`.
- **Build tool:** Vite **6**.
- **Repo structure:** Flat single-package repo. One `package.json`, one Vite app, everything under `src/`. No monorepo tooling. Hosted on GitHub. Path alias `@/* → src/*` (configured in `tsconfig.json` and `vite.config.ts`).
- **Access:** Authenticated via Okta only. SPC is not publicly accessible. No public routes, no unauthenticated states to handle beyond the Okta redirect. The customer portal is a separate product in a separate repo — do not conflate the two.
- **API client:** Auto-generated from TripServices OpenAPI spec using `openapi-typescript`. Do not hand-write API types. *`openapi-typescript` not yet installed — add when wiring the first real endpoint.*
- **Auth:** OAuth 2.0 client credentials via Okta. Token refresh handled in a shared auth module (`src/lib/auth/`) — do not reimplement per feature.

### Not in scope

- Next.js / SSR (this is a client-side desktop application, not a web page)
- GraphQL
- Class components
- Redux (use Zustand)
- `any` types

---

## Project status

Scaffolded on 2026-06-15. The project is initialised and verified (`typecheck`, `test`, `build` all pass) but **no features are built yet**.

### What exists

- Vite 6 + React 18 + TypeScript (strict) app. Entry: `index.html` → `src/main.tsx` → `src/App.tsx` (a placeholder shell — replace with the routed workspace and route all copy through i18n when the real shell is built).
- Tailwind v3 with the full SPC token set in `src/globals.css`, mapped in `tailwind.config.ts`.
- shadcn/ui configured (`components.json`, `cn` in `src/lib/utils.ts`); `src/components/ui/` is empty and ready for `npx shadcn@latest add`.
- Folders: `src/features/`, `src/components/`, `src/lib/` (`constants.ts`, `auth/index.ts`), `src/assets/` (empty dirs hold a `.gitkeep`).
- Typed env in `src/vite-env.d.ts` (`import.meta.env.VITE_*`).
- Vitest + RTL (`src/test/setup.ts`, sample `src/App.test.tsx`). Playwright (`playwright.config.ts`, `e2e/`).
- `.env.example` committed; `.gitignore` excludes `.env.local`, `node_modules`, `dist`.

### Commands

- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — typecheck + production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run test` / `npm run test:watch` — Vitest
- `npm run test:e2e` — Playwright

### Pending manual steps (not done by the scaffold)

- Copy `.env.example` → `.env.local` and fill real TripServices + Okta values.
- Run `npx playwright install chromium` before the first E2E run (browser binaries are not downloaded).
- Drop the real Travelport wordmark at `src/assets/travelport-logo.svg` before building the topbar.
- Install when first needed: Zustand, TanStack Query v5, `react-i18next`, `openapi-typescript`, ESLint/Prettier. Note: `tsc` blocks *implicit* `any`; enforcing the "no `any`" rule against **explicit** `any` requires ESLint (`@typescript-eslint/no-explicit-any`).

---

## Design system

### Visual direction

Clean, white, professional. Reference: Superhuman, Linear, Vercel dashboard. High information density without visual noise. Every element earns its place. No gradients, no decorative shadows, no consumer UX patterns.

The brand green is structural, not dominant. It appears in three places only: the active sidebar border accent, the active nav background tint, and the primary action button. Everywhere else is greyscale.

### Colour tokens

Apply these as CSS variables in `globals.css` and map them into `tailwind.config.ts`.

#### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--color-canvas` | `#FFFFFF` | Main content area |
| `--color-surface` | `#FAFAFA` | Sidebar, secondary panels |
| `--color-hover` | `#F3F4F6` | Row hover, inactive nav item active state |
| `--color-selected` | `#EBF0EC` | Active sidebar item background, selected rows |
| `--color-border` | `#E4E7E5` | All borders, dividers, table rules |

#### Typography

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#111827` | Headings, booking refs, key data |
| `--color-text-secondary` | `#374151` | Body text, row content |
| `--color-text-muted` | `#6B7280` | Inactive nav, secondary labels |
| `--color-text-subtle` | `#9CA3AF` | Column headers, timestamps, hints |

#### Brand green

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#4E5D53` | Primary button, active sidebar border, logo wordmark accent |
| `--color-brand-pressed` | `#3A4840` | Primary button hover/pressed state |
| `--color-brand-tint` | `#EBF0EC` | Active sidebar background, selected state fill |

#### Accent

| Token | Hex | Usage |
|---|---|---|
| `--color-accent` | `#FF5E6F` | Urgent queue counts, deadline badges, action-needed status, destructive actions |
| `--color-accent-tint` | `#FEF0F1` | Urgent badge background in tables |

#### Semantic status

| Token | Hex | Usage |
|---|---|---|
| `--color-confirmed` | `#EDFAED` | Ticketed / confirmed status badge background |
| `--color-confirmed-text` | `#1E7A1E` | Ticketed / confirmed status badge text |
| `--color-warning` | `#FEF6E6` | Review / pending status badge background |
| `--color-warning-text` | `#B06A00` | Review / pending status badge text |
| `--color-urgent` | `#FEF0F1` | Action-needed / overdue badge background |
| `--color-urgent-text` | `#C8202E` | Action-needed / overdue badge text |

#### Content type (always visible in search results and queue entries)

| Token | Hex | Usage |
|---|---|---|
| `--color-ndc` | `#EBF2FB` | NDC badge background |
| `--color-ndc-text` | `#2255A0` | NDC badge text |
| `--color-edifact` | `#F3F4F6` | EDIFACT badge background |
| `--color-edifact-text` | `#4B5563` | EDIFACT badge text |
| `--color-lcc` | `#FEF6E6` | LCC badge background |
| `--color-lcc-text` | `#B06A00` | LCC badge text |

### Tailwind config mapping

The full token set is implemented in `tailwind.config.ts` under `theme.extend.colors`. shadcn semantic colours are driven by the CSS variables (`hsl(var(--token))`); SPC design tokens are concrete hex. As implemented:

```ts
// tailwind.config.ts — theme.extend.colors (abridged)
colors: {
  // shadcn semantic — CSS-variable driven (see shadcn overrides below)
  border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
  background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
  primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))' },
  secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))' },
  destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
  muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))' },
  popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))' },
  card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))' },

  // SPC design tokens — concrete hex
  brand: { DEFAULT: '#4E5D53', pressed: '#3A4840', tint: '#EBF0EC' },
  accent: { DEFAULT: '#FF5E6F', tint: '#FEF0F1' },
  canvas: '#FFFFFF', surface: '#FAFAFA',
  hover: '#F3F4F6', 'color-hover': '#F3F4F6', selected: '#EBF0EC',
  fg: { primary: '#111827', secondary: '#374151', muted: '#6B7280', subtle: '#9CA3AF' },
  confirmed: { DEFAULT: '#EDFAED', text: '#1E7A1E' },
  warning:   { DEFAULT: '#FEF6E6', text: '#B06A00' },
  urgent:    { DEFAULT: '#FEF0F1', text: '#C8202E' },
  ndc:     { DEFAULT: '#EBF2FB', text: '#2255A0' },
  edifact: { DEFAULT: '#F3F4F6', text: '#4B5563' },
  lcc:     { DEFAULT: '#FEF6E6', text: '#B06A00' },
}
```

**Token → utility-name reconciliations.** Several SPC tokens collide with shadcn's reserved Tailwind keys (`primary`, `secondary`, `muted`, `accent`). To keep shadcn components working, the SPC text tokens are namespaced under `fg-*`. Use these actual class names:

| Concept (this doc) | Hex | Use this utility |
|---|---|---|
| Heading / key text | `#111827` | `text-fg-primary` (bare `text-primary` is shadcn brand green — do not use for text) |
| Body / row text | `#374151` | `text-fg-secondary` |
| Muted / secondary label | `#6B7280` | `text-fg-muted` (or `text-muted-foreground`) |
| Subtle / column header / timestamp | `#9CA3AF` | `text-fg-subtle` |
| Row / nav hover bg | `#F3F4F6` | `bg-hover` (alias `bg-color-hover`) |
| Status badge bg / text | — | `bg-confirmed` / `text-confirmed-text` (same shape for `warning`, `urgent`) |
| Content badge bg / text | — | `bg-ndc` / `text-ndc-text` (same shape for `edifact`, `lcc`) |

**Note on `accent`.** Per this spec the Tailwind `accent` key is the SPC red (`#FF5E6F`), so shadcn's neutral hover (`bg-accent`) reads red. When adding shadcn components, switch their ghost/hover variants to `bg-hover` (which also matches the row-hover rule). The same red is also available as `bg-destructive` / `text-destructive`.

### shadcn/ui token overrides

Override the shadcn default CSS variables in `globals.css` to match the SPC palette. The implemented `globals.css` also keeps the raw SPC `--color-*` tokens (source of truth) and adds three shadcn vars omitted from the list below — `--card`, `--popover`, `--accent` (each with `-foreground`) — set to neutral SPC values so owned shadcn components render correctly:

```css
:root {
  --background: 0 0% 100%;           /* #FFFFFF */
  --foreground: 220 13% 13%;         /* #111827 */
  --card: 0 0% 100%;                 /* #FFFFFF — added (not in original list) */
  --card-foreground: 220 13% 13%;    /* #111827 — added */
  --popover: 0 0% 100%;              /* #FFFFFF — added */
  --popover-foreground: 220 13% 13%; /* #111827 — added */
  --accent: 220 9% 96%;              /* #F3F4F6 — added, neutral hover for shadcn internals */
  --accent-foreground: 220 13% 13%;  /* #111827 — added */
  --muted: 220 9% 96%;               /* #F3F4F6 */
  --muted-foreground: 220 9% 46%;    /* #6B7280 */
  --border: 150 8% 89%;              /* #E4E7E5 */
  --input: 150 8% 89%;               /* #E4E7E5 */
  --primary: 150 8% 34%;             /* #4E5D53 */
  --primary-foreground: 0 0% 100%;   /* #FFFFFF */
  --secondary: 150 8% 93%;           /* #EBF0EC */
  --secondary-foreground: 220 13% 13%;
  --destructive: 354 100% 68%;       /* #FF5E6F */
  --destructive-foreground: 0 0% 100%;
  --ring: 150 8% 34%;                /* #4E5D53 — focus rings */
  --radius: 0.375rem;                /* 6px — tight, professional */
}
```

### Typography

- **Font:** Inter (system fallback: `ui-sans-serif, system-ui`). Load via `@fontsource/inter`.
- **Scale:** Tight. Use `text-xs` (10–11px) for column headers and badges. `text-sm` (12–13px) for body and table content. `text-base` (14–15px) for section titles. `text-lg` (16–18px) for page headings only.
- **Weight:** 400 for body, 500 for labels and nav items, 600 for headings and booking refs.
- **Tracking:** `tracking-wide` and uppercase only for column headers (`text-xs font-semibold tracking-wider uppercase text-fg-subtle`).

### Component behaviour rules

- **Borders:** `0.5px solid` throughout. Never `1px` on table rows or cards — it reads as heavy.
- **Border radius:** `rounded-md` (6px) for buttons and badges. `rounded-lg` (8px) for cards and panels. `rounded-full` for avatar initials and count pills only.
- **Shadows:** None on most elements. `shadow-sm` only on floating elements (dropdowns, popovers, command palette).
- **Active sidebar item:** Left border `border-l-2 border-brand` plus `bg-selected text-fg-primary font-medium`. This is the only place a 2px border is used.
- **Primary button:** `bg-brand text-white hover:bg-brand-pressed`. No outline variant for primary actions.
- **Badges:** Always `rounded-full`, `text-xs font-semibold`, tint background with matching text colour from semantic tokens above.
- **Table rows:** `border-b border-border` with `hover:bg-hover` transition. No zebra striping.
- **Focus rings:** `ring-2 ring-brand ring-offset-2`. Consistent across all interactive elements.

### Logo and topbar

The Travelport logo (black SVG wordmark) sits in the top-left of the topbar on a white background. The topbar is white, `border-b border-border`, height `h-11` (44px). Do not add background colour to the logo area. Place the actual SVG at `src/assets/travelport-logo.svg` and import it as a React component.

---

## Architecture principles

**Component structure.** Three layers:

1. `features/` — domain-specific feature modules (e.g., `features/queue`, `features/pnr`, `features/search`). Each feature owns its own components, hooks, and local state. Features do not import from other features directly — shared logic moves to `lib/` or `components/`.
2. `components/` — shared, reusable UI primitives with no business logic. These are design system components: Button, Modal, DataTable, Badge, etc.
3. `lib/` — shared utilities, API client, auth, formatters, constants.

**No business logic in components.** Business logic lives in hooks (`use*.ts`) or service modules (`lib/`). Components receive data and fire events. They do not call APIs directly.

**Error handling is not optional.** Every API call must have: a loading state, an error state with a meaningful message to the agent (not a raw API error), and a recovery action where possible (retry, refresh, redirect).

**Optimistic updates where appropriate.** Seat assignments, queue actions, and PNR field updates should reflect immediately in the UI. Roll back on failure.

**Accessibility.** WCAG 2.1 AA minimum. Keyboard navigation required for all interactive elements. Agents may use SPC all day; screen reader and keyboard-first UX is not optional.

**Internationalisation.** All user-facing strings go through `react-i18next`. No hardcoded English strings in JSX. Date, time, and currency formatting via `Intl` — never manual.

**Performance.** Time-to-interactive target: under 2 seconds on initial load. Search results: under 1 second from API response to rendered UI. Use `React.memo`, `useMemo`, and `useCallback` only where profiled as necessary — do not pre-optimise.

---

## Feature scope

Build these feature areas. Each is a separate module in `features/`.

### 1. Search

Air shopping across EDIFACT, NDC, and LCC content.

- One-way, return, multi-city itinerary input
- Cabin class, passenger count (ADT/CHD/INF), fare basis filter
- Results: sortable by price, duration, stops, departure time
- Fare families display with included/excluded ancillaries
- NDC vs EDIFACT content clearly labelled (agents need to know)
- Hold/price lock where available
- Recent searches persisted per agent session

### 2. PNR / Order / Trip display

The core workspace. An agent may have multiple PNRs open simultaneously.

- Trip summary: all segments, passengers, fare, ticketing deadline, booking reference
- Segment timeline view (visual itinerary)
- Passenger details: names, documents, SSRs, OSIs
- Ticketing status and deadline with colour-coded urgency
- Associated ancillaries (seats, bags, meals)
- Fare breakdown: base fare, taxes, total per passenger
- History log: all changes to the trip, timestamped
- Linked trips (group bookings)
- Tab interface for multiple open trips

### 3. Queue management

The daily operational hub for most agents.

- Queue list with entry count, category, priority
- Single queue view: list of PNRs/Orders with key fields visible without opening
- Bulk actions: place on queue, remove from queue, assign to agent
- Queue categories: schedule change, ticketing deadline, agency queues, custom
- Filter and sort by departure date, ticketing deadline, airline, priority
- Productivity Automator integration: AI-surfaced exceptions and recommended actions displayed inline
- One-click action execution from queue view (accept SKDCHG, requeue, open trip)

### 4. Booking flow

From search result to confirmed order.

- Passenger details entry with profile auto-fill
- Seat selection with interactive cabin map
- Ancillary selection: bags, meals, upgrades
- Fare rule display before ticketing (non-refundable, change fees, etc.)
- Payment: agency credit, BSP, form of payment entry
- Review and confirm screen
- Confirmation: booking reference, e-ticket numbers, itinerary summary
- Direct-to-print or email itinerary from confirmation

### 5. Servicing

Post-booking modifications.

- Schedule change acceptance/rejection workflow
- Voluntary change: same-day void, exchange/reissue with fare recalculation display
- Seat reassignment
- Ancillary add/remove
- SSR/OSI add, modify, delete
- Cancel with refund/void eligibility display
- Split PNR (divide party)
- Add passive segment

### 6. Agent workspace and configuration

- Agency and PCC switcher (agents work across multiple PCCs)
- Credential Access Manager integration: which PCCs the agent has access to
- Personal preferences: default cabin, default currency, preferred view (list vs. calendar)
- Notification centre: schedule changes, ticketing deadlines, queue alerts
- Activity log: all actions taken in current session

### 7. Productivity Automator panel

AI-native queue intelligence. This is a first-class feature, not a widget.

- Queue exception feed: AI-classified exceptions with recommended action
- Bulk auto-accept: one-click acceptance of low-risk schedule changes
- Quality control alerts: missing documents, unticketed segments, fare discrepancies
- Auto-ticketing rules display and override
- Action history: what PA actioned, when, with what outcome

---

## Component and naming conventions

- Component files: PascalCase (`TripPanel.tsx`, `QueueEntry.tsx`)
- Hook files: camelCase with `use` prefix (`useTrip.ts`, `useQueueEntries.ts`)
- Feature folders: lowercase kebab (`features/queue-management/`, `features/trip-display/`)
- Test files: co-located, `.test.tsx` suffix (`TripPanel.test.tsx`)
- API types: imported from generated types, prefixed with API namespace (`TripServicesTrip`, `TripServicesOrder`)
- Constants: SCREAMING_SNAKE_CASE in `lib/constants.ts`

---

## Environment variables

Credentials and environment-specific config live in `.env.local` at the project root. This file is git-ignored and never committed. Do not hardcode any of these values anywhere in the codebase.

Reference them in code as `import.meta.env.VITE_*`. Vite only exposes variables prefixed with `VITE_` to the client bundle.

**Token flow (verified, pre-production).** `POST {VITE_TRIPSERVICES_AUTH_URL}` with `grant_type=client_credentials` and `client_id`/`client_secret` in the form body returns a `Bearer` token (`expires_in` 86400 = 24h). The trial portal username/password are **not** used for the API token; PCC and access group are agency context sent on API requests, not part of token generation. Security note: in production the token exchange should run server-side (and prod auth is Okta) — a browser call to the auth endpoint also risks CORS — so the sandbox `CLIENT_SECRET` must not ship to real users. In dev, front the token call with a Vite dev-server proxy.

| Variable | Description |
|---|---|
| `VITE_TRIPSERVICES_BASE_URL` | TripServices API base URL. Pre-production: `https://api.pp.travelport.net/` |
| `VITE_TRIPSERVICES_AUTH_URL` | OAuth token endpoint. Pre-production: `https://auth.pp.travelport.net/oauth/token` |
| `VITE_TRIPSERVICES_CLIENT_ID` | TripServices API client ID (from sandbox credentials) |
| `VITE_TRIPSERVICES_CLIENT_SECRET` | TripServices API client secret (from sandbox credentials) |
| `VITE_TRIPSERVICES_PCC` | Pseudo City Code — agency context sent on API requests |
| `VITE_TRIPSERVICES_ACCESS_GROUP` | Access Group GUID — agency context sent on API requests |
| `VITE_TRIPSERVICES_REGION` | Trial region (e.g. `NORAM`) |
| `VITE_DEFAULT_CURRENCY` | Default currency for shopping/pricing (e.g. `USD`) |
| `VITE_OKTA_ISSUER` | Okta authorisation server issuer URL |
| `VITE_OKTA_CLIENT_ID` | Okta application client ID |
| `VITE_OKTA_REDIRECT_URI` | Post-login redirect URI (typically `http://localhost:5173/login/callback` in dev) |
| `VITE_ENV` | Environment identifier: `development`, `staging`, or `production` |

A `.env.example` file with these variable names and placeholder values should be committed to the repo so any new developer knows what is required. The `.env.local` with real values is never committed.

```bash
# .env.example — commit this, never the real values
VITE_TRIPSERVICES_BASE_URL=https://api.pp.travelport.net/
VITE_TRIPSERVICES_AUTH_URL=https://auth.pp.travelport.net/oauth/token
VITE_TRIPSERVICES_CLIENT_ID=your-client-id-here
VITE_TRIPSERVICES_CLIENT_SECRET=your-client-secret-here
VITE_TRIPSERVICES_PCC=your-pcc
VITE_TRIPSERVICES_ACCESS_GROUP=your-access-group-guid
VITE_TRIPSERVICES_REGION=NORAM
VITE_DEFAULT_CURRENCY=USD
VITE_OKTA_ISSUER=https://your-org.okta.com/oauth2/default
VITE_OKTA_CLIENT_ID=your-okta-client-id-here
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
VITE_ENV=development
```

### Developer resources

Official documentation and support for TripServices:

- Developer portal: https://developer.travelport.com/
- Getting started guide: https://developer.travelport.com/getting-started-guide
- The sandbox mirrors production. Build against it with confidence — the API structure, authentication flow, and response shapes are identical to production.

---

## What to do when an endpoint does not exist yet

Some TripServices endpoints are in development or not yet available in sandbox.

When this happens:
1. Build the UI component fully with typed mock data
2. Add a comment at the top of the hook: `// MOCK: TripServices endpoint not yet available. Replace with real call when live.`
3. Define the expected response type in `lib/api/types/` as if the real API exists
4. Do not leave it undocumented or silently broken

---

## What not to build without explicit instruction

- Any new design system primitives (extend existing ones)
- Any new authentication or token-handling logic (use the shared auth module)
- Any direct calls to legacy GWS or uAPI
- Any server-side rendering, API routes, or backend logic — SPC is a pure client
- Any third-party booking widgets or iframes

---

## Output standards

Every feature delivery must include:

1. The feature component(s) in `features/`
2. The data-fetching hook(s) in the same feature folder
3. Unit tests for the hook (data transformation, error handling)
4. Component tests for the primary user interactions
5. A brief `README.md` in the feature folder describing: what it does, which TripServices endpoints it uses, and any known limitations

If a feature spans multiple files, list them at the start of the response before writing any code.

---

## Verification checkpoints

After completing any feature, verify:

- [ ] No hardcoded English strings in JSX (all via i18n keys)
- [ ] All interactive elements are keyboard-accessible
- [ ] Loading and error states are handled
- [ ] No `any` types
- [ ] API types come from generated spec, not hand-written
- [ ] Tests cover at least: success path, empty state, error state