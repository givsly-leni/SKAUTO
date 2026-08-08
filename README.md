# SKAUTO

TypeScript + React (Vite) PWA. Installs on iPhone (Add to Home Screen) and
runs as a normal site on laptop/desktop. Backed by a Supabase Postgres
database, deployed on Netlify.

## Stack

- React 18 + TypeScript, bundled with Vite
- `vite-plugin-pwa` — installable app, offline-ready service worker
- Supabase (`@supabase/supabase-js`) — free hosted Postgres + auth
- Netlify — hosting + CI deploys from GitHub

## 1. Install & run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. On your phone, visit your laptop's LAN IP
(shown in the terminal) while on the same Wi-Fi to test on iPhone before
deploying.

## 2. Set up Supabase (free)

1. Create a project at https://supabase.com (free tier).
2. In the project dashboard: **Settings → API**, copy the Project URL and
   `anon` public key.
3. Copy `.env.example` to `.env` and paste those two values in.
4. Open the **SQL editor** in Supabase, paste the contents of
   `supabase/schema.sql`, and run it. This creates a starter `items` table
   — replace it with your real schema once the app's data model is defined.

## 3. Push to GitHub

This repo is already git-initialized locally with the scaffold committed.
Point it at your GitHub repo and push:

```bash
git remote add origin https://github.com/givsly-leni/SKAUTO.git
git branch -M main
git push -u origin main
```

If prompted for a password, use a GitHub Personal Access Token (not your
account password).

## 4. Deploy on Netlify

1. https://app.netlify.com → **Add new site → Import an existing project**.
2. Connect GitHub, pick `givsly-leni/SKAUTO`.
3. Build settings are already defined in `netlify.toml`
   (`npm run build`, publish `dist`) — Netlify will detect them automatically.
4. Add environment variables in **Site configuration → Environment
   variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same
   values as your `.env`).
5. Deploy. Every push to `main` auto-deploys.

## 5. Install on iPhone

Open the Netlify URL in Safari → Share → **Add to Home Screen**. It launches
full-screen like a native app.

## Project structure

```
src/
  lib/supabaseClient.ts   shared Supabase client
  components/             UI components
  App.tsx                 app shell / routes
public/                   static assets, PWA icons
supabase/schema.sql       starter DB schema
netlify.toml              Netlify build + SPA redirect config
```
