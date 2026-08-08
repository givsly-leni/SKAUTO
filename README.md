# SKAUTO

Workshop record-keeping app for a single mechanic. Track the cars you're
fixing, have fixed, or are booked in to fix — customer details, plate, VIN,
cost, restored parts and notes.

Installs on iPhone via Add to Home Screen, works as a normal site on laptop.

**Live:** https://skautogarage.netlify.app

## Stack

- React 18 + TypeScript, bundled with Vite
- `vite-plugin-pwa` — installable app, offline-ready service worker
- Supabase — Postgres database + email/password auth
- Netlify — hosting, auto-deploys on every push to `main`

No routing library: the app uses a ~60-line hash router (`src/lib/router.tsx`),
which keeps the dependency list minimal and means deep links work identically
on Netlify, on localhost, and inside the home-screen app.

## How it works

**Auth.** Email + password via Supabase. Registration is a one-time affair —
`signup_available()` returns false once the first account exists, and the
register form disappears. Nobody else can create an account on the live site.

**Data.** One `vehicles` table. Every row is stamped with `user_id` and
row-level-security policies mean a signed-in account can only ever read or
write its own records — the client never has to filter by user.

**Fields.** Customer name and phone, license plate, VIN, vehicle year/date,
job status (scheduled / in progress / completed), cost, restored parts (a
list), and free-text notes. The registration date is set automatically by the
database, as is `updated_at` on every edit.

## Vehicle make / model data

Make and model suggestions come from the **NHTSA vPIC** database
(`vpic.nhtsa.dot.gov/api`) — public, free, no API key, no rate limit, and
CORS-enabled so the browser calls it directly. `src/lib/vehicleApi.ts` wraps
three uses:

- list makes across cars, trucks and MPVs
- list models for a chosen make
- decode a VIN into make / model / year, plus engine and body details

Responses are cached in `localStorage` for 30 days, so the pickers are instant
after first use and keep working offline.

vPIC is a US database, so a model sold only outside the US may be missing.
Both fields are comboboxes that accept free text, so an unlisted model can
always be typed in by hand.

## Pages

| Route | What it does |
| --- | --- |
| `#/` | Overview — counts per status, total value of completed work, 5 most recent |
| `#/vehicles` | Full list, searchable by plate/customer/VIN/phone, filterable by status |
| `#/vehicles/new` | Add a car |
| `#/vehicles/:id` | Detail view, with edit and delete |
| `#/vehicles/:id/edit` | Edit a car |

Navigation is a bottom tab bar on phone, a top bar on laptop.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. Requires a `.env` file (copy `.env.example`)
with your Supabase project URL and anon key — find them under
**Settings → API** in the Supabase dashboard.

To test on your iPhone before deploying, visit your laptop's LAN IP (printed
in the terminal on startup) while on the same Wi-Fi.

## Deploying

Push to `main` and Netlify builds and deploys automatically. The two Supabase
env vars are already set on the Netlif