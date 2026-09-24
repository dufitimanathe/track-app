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

Open [http://localhost:3000](http://localhost:3000) for the public KAMPERE MOTARI LTD landing page. The sign-in link opens the existing role-based workspace; signed-in users can also visit the landing page.

## Public landing page

The homepage includes company information, services, employee WhatsApp booking guidance, partnerships, FAQs, and the public phone contact (+250 782 027 429). Employee accounts return to `/#employees` after signing in.

Optional build-time settings:

- `NEXT_PUBLIC_CONTACT_EMAIL`: a verified public email address; omitted when unset.
- `NEXT_PUBLIC_BOOKING_WHATSAPP`: the verified booking WhatsApp number in international format. Enables a direct booking link when set. The public phone number is not assumed to be the booking channel.

Content and scoped styles live in `src/components/landing/`. Add named partner companies only after their details are confirmed. Space Grotesk is loaded through `next/font`; builds need access to Google Fonts, as they already do for the dashboard’s Geist fonts.

## Netlify deployment

The frontend repository includes `netlify.toml` with the build command,
publish directory, and a secret-scanning exception for three public browser
variables. Next.js embeds these values in its JavaScript bundles by design:

- `NEXT_PUBLIC_API_URL`: the deployed backend URL, including `/api/v1`.
- `NEXT_PUBLIC_WS_URL`: the deployed Socket.IO endpoint, including `/realtime`.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: the Google Maps browser key.

Set these values in Netlify's environment variables for the build context.
Use the deployed backend's HTTPS URLs instead of the localhost development
defaults. Restrict the Maps browser key to the frontend's allowed website
referrers and required Google Maps APIs in Google Cloud.

`SECRETS_SCAN_OMIT_KEYS` excludes only these three intentionally public values;
secret scanning remains enabled for other variables. Do not put server secrets
in `NEXT_PUBLIC_*` variables or add them to this exception.

Push this configuration and trigger a new deploy. Changes to `NEXT_PUBLIC_*`
values also require a new build because they are embedded at build time.

References: [Netlify secret-scanning configuration](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning),
[Next.js public environment variables](https://nextjs.org/docs/app/guides/environment-variables#bundling-environment-variables-for-the-browser),
and [Google Maps key restrictions](https://developers.google.com/maps/api-security-best-practices).

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
