# Travelport TripServices Demo

A professional travel agent desktop built on [Travelport TripServices](https://developer.travelport.com). React, TypeScript, shadcn/ui, deployed on Railway.

> **This is not a Travelport product.** This is an independent demonstration application. It is not supported, endorsed, or maintained by Travelport. It exists to show what is possible when you build on the TripServices API — and to give any developer a working starting point for doing the same.

---

## What this is

Travelport TripServices Demo is a full-stack travel agent application built from scratch using the TripServices API. It handles air search across GDS content, booking, trip management, and queue workflows — the core of what a professional travel agent does every day.

The application is live at [tripservices-demo-production.up.railway.app](https://tripservices-demo-production.up.railway.app).

The more important output is the `CLAUDE.md` file in this repo. It is a complete context document that gives any AI coding agent — Claude, Cursor, Copilot — everything it needs to build a travel application on TripServices from a single prompt. Domain vocabulary, API patterns, authentication quirks, response structure, design system, and lessons learned from a real build. The goal is that a developer who has never touched travel technology can fork this repo, add their credentials, and have a working product.

---

## The one-prompt goal (WIP)

The `CLAUDE.md` in this repo is designed to enable a complete travel application build from a single prompt. Drop it in the root of a new project, open Claude Code or your AI editor of choice, and run:

```
Read CLAUDE.md fully. Then scaffold a travel agent application using the TripServices API. Follow the architecture, design system, and API patterns defined in the file exactly.
```

Everything the agent needs is in that file: stack decisions, design tokens, TripServices authentication flow, endpoint paths, response structure, the reference-based data model, required headers, environment variable schema, and the lessons learned that the official documentation does not cover.

---

## Stack

- **React 18** with TypeScript (strict mode)
- **Vite** for bundling
- **shadcn/ui** on Radix UI primitives for components
- **Tailwind CSS** for styling
- **Zustand** for global state
- **TanStack Query v5** for server state
- **react-i18next** for internationalisation
- **Express** as a production proxy server (handles CORS and header re-casing for the TripServices API)
- **Deployed on Railway**

---

## TripServices API

This application uses the [Travelport TripServices API](https://developer.travelport.com) — a unified REST/JSON platform for air shopping, booking, and servicing across GDS, NDC, and LCC content.

To run this application, you need TripServices sandbox credentials. You can request them at [developer.travelport.com](https://developer.travelport.com).

**Download the Postman DevKit.** Available at [developer.travelport.com/resources/devkits-and-downloads](https://developer.travelport.com/resources/devkits-and-downloads). The collection has the correct auth configuration pre-wired, it is good for reference.

**The Air Search response is reference-based, not embedded.** Flights, brands, products, and terms live in separate `ReferenceList` arrays and are joined to offers by ID. Build lookup maps before processing offers. Every offer field that looks like it should contain data is actually a reference ID.

**The `XAUTH_TRAVELPORT_ACCESSGROUP` header is case-sensitive.** Browsers lowercase all custom headers. The production Express proxy in this repo re-cases it before forwarding. Do not remove that logic.

All of this is documented in `CLAUDE.md` so the AI agent handles it correctly without you having to discover it yourself.

---

## Getting started

### Prerequisites

- Node.js 18+
- TripServices sandbox credentials from [developer.travelport.com](https://developer.travelport.com)

### Local setup

```bash
git clone https://github.com/cassiux/tripservices-demo
cd tripservices-demo
npm install
cp .env.example .env.local
```

Populate `.env.local` with your TripServices credentials. Note the password formatting:

```bash
# Wrap in double quotes and escape $ with backslash if your password contains special characters
VITE_TRIPSERVICES_PASSWORD="your-password-here"
```

```bash
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_TRIPSERVICES_AUTH_URL` | OAuth token endpoint. Use `/tp-auth/oauth/token` (proxy path) for both local and production |
| `VITE_TRIPSERVICES_BASE_URL` | API base URL. Use `/tp-api/` (proxy path) for both local and production |
| `VITE_TRIPSERVICES_USERNAME` | TripServices username — required in token request |
| `VITE_TRIPSERVICES_PASSWORD` | TripServices password — required in token request |
| `VITE_TRIPSERVICES_CLIENT_ID` | OAuth client ID |
| `VITE_TRIPSERVICES_CLIENT_SECRET` | OAuth client secret |
| `VITE_TRIPSERVICES_SCOPE` | Must be `openid` |
| `VITE_TRIPSERVICES_PCC` | Pseudo City Code for your sandbox account |
| `VITE_TRIPSERVICES_ACCESS_GROUP` | Access Group UUID for your sandbox account |
| `TP_AUTH_URL` | Server-side only. Real auth upstream: `https://auth.pp.travelport.net` |
| `TP_API_URL` | Server-side only. Real API upstream: `https://api.pp.travelport.net` |

`TP_AUTH_URL` and `TP_API_URL` have no `VITE_` prefix — they are read by the Express proxy server, never bundled into the client.

### Deploying to Railway

1. Fork this repo and connect it to a Railway project
2. Set all environment variables in the Railway dashboard (no quotes, no shell escaping)
3. Set the build command to `npm run build` and start command to `npm start`
4. Deploy

The Express server in `server.js` serves the Vite build and proxies all TripServices calls server-side, resolving CORS and the header casing issue in production.

---

## Using CLAUDE.md to build your own application

The `CLAUDE.md` in this repo is the most transferable output of this project. It is not tied to this application specifically — it is a blueprint for any application built on TripServices.

To use it for your own build:

1. Copy `CLAUDE.md` into your new project root
2. Update the product description at the top to reflect what you are building
3. Add your TripServices credentials to `.env.local`
4. Open Claude Code in your project directory and run the scaffold prompt

The file contains everything an AI agent needs: authentication flow with the correct six fields, required headers per endpoint, the Air Search response data model with the reference graph explained, design tokens, component conventions, testing standards, and internationalisation requirements.

The authentication section alone is worth the copy. Everything the documentation should say but does not.

---

## Project structure

```
tripservices-demo/
├── CLAUDE.md               — AI agent context file. The primary output of this project.
├── server.js               — Express production proxy. Handles CORS and header re-casing.
├── src/
│   ├── features/           — Feature modules (search, booking, trip-display, agent-workspace)
│   ├── components/         — Shared UI components (shadcn/ui based)
│   ├── lib/
│   │   ├── auth/           — OAuth token management. Do not reimplement per feature.
│   │   ├── api/            — TripServices API client with typed error handling
│   │   └── constants.ts    — Route constants, header names
│   ├── store/              — Zustand stores (booking flow, agent preferences)
│   └── locales/            — i18n strings
├── e2e/                    — Playwright end-to-end tests
└── .env.example            — Environment variable schema with descriptions
```

---

## What is built

| Feature | Status | Description |
|---|---|---|
| 🔄 **Search** | In progress | Air shopping across GDS content. Calendar picker, cabin class, passenger count, fare basis filter. Results sorted by price, duration, and stops. Content type badges (GDS, NDC, LCC) on every result. |
| 📋 **Booking flow** | To do | Passenger details with profile auto-fill, seat selection, ancillary selection, fare rules review, and order confirmation. |
| 🧾 **Trip display** | To do | Post-booking confirmation view with segment timeline, ticketing deadline urgency, fare breakdown, and copyable booking reference. |
| ⚙️ **Agent workspace** | To do | PCC switcher, preferences (default cabin, currency, date format), notification centre, and session activity log. |
| 📬 **Queue management** | To do | Schedule change queue, ticketing deadline queue, agency queues. Bulk actions and one-click resolution. |
| 🔧 **Servicing** | To do | Void, refund, reissue, seat reassignment, SSR/OSI management, split PNR. |
| 🤖 **Automation** | To do | AI-native queue intelligence. Exception feed, bulk auto-accept, quality control alerts, auto-ticketing rules. |

---

## Disclaimer

Travelport TripServices Demo is built independently by a Travelport employee for demonstration purposes. It is not a Travelport product, does not represent Travelport's official development practices, and is not supported by Travelport's engineering or customer success teams. Use the TripServices API in accordance with your developer agreement.
