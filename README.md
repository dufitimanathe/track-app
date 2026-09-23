# FleetOps Web Frontend

Multi-tenant corporate transport & motorcycle fleet management UI.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Redux Toolkit
- Lucide icons

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/admin`.

## Current status

**UI-first phase** with realistic mock data (Virunga Transport Ltd, Kigali locations, RWF pricing).

Backend integration (NestJS `/api/v1` + Socket.IO) is the next step.

## Roles (preview switcher in header)

| Role | Entry |
|------|--------|
| Company Admin | `/admin` |
| Supervisor | `/supervisor` |
| Rider | `/rider` |

Auth/onboarding: `/login`, `/register`, `/onboarding/*`

## Design system

Tokens live in `src/app/globals.css`. Shared components under `src/components/ui/`.

Primary blue `#2563EB` · Status green / amber / red used for operational meaning only.
