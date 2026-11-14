<div align="center">

<img src="public/logos/logo.svg" alt="Lingriser" width="220" />

### IELTS & TOEIC practice with AI scoring

The web frontend for [meowlish](https://github.com/HDkit/meowlish): real-format mock tests, Speaking & Writing practice with AI feedback, flashcards and progress tracking.

[![Live](https://img.shields.io/badge/live-meowlish--fe.vercel.app-000?logo=vercel&logoColor=white)](https://meowlish-fe.vercel.app)
![Version](https://img.shields.io/badge/version-0.9.0-58c27d)

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06b6d4?logo=tailwindcss&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2-764abc?logo=redux&logoColor=white)
![Vitest](https://img.shields.io/badge/tested%20with-Vitest-6e9f18?logo=vitest&logoColor=white)

[Live site](https://meowlish-fe.vercel.app) · [Backend](https://github.com/HDkit/meowlish) · [Changelog](https://meowlish-fe.vercel.app/changelog)

</div>

## Try it

Open **[meowlish-fe.vercel.app](https://meowlish-fe.vercel.app)** and press **"Dùng thử bằng tài khoản demo"** on the login page, or sign in by hand:

| Email | Password |
|---|---|
| `demo@lingriser.test` | `Demo@12345` |

The demo account is shared, so its password, username and sign-in methods can't be changed (the backend refuses with `403`). Anyone can edit its other data, and a backend reseed resets it.

> [!NOTE]
> AI services are paused for now: Speaking scoring, answer explanations and quick translation are off, and Writing returns random sample scores. Everything else works. Set `NEXT_PUBLIC_AI_SERVICE_OPERATIONAL=true` at build time to remove the notice.

## Features

| | |
|---|---|
| **Mock tests** | IELTS Academic and TOEIC Listening & Reading in the real exam format, with real media |
| **Speaking & Writing** | Practice with AI scoring and feedback on pronunciation, grammar and vocabulary |
| **Flashcards** | Personal decks with spaced repetition |
| **Progress** | Score charts, an activity heatmap and per-skill strengths and weaknesses |
| **Community** | Blog and chat rooms (socket.io) |
| **Staff tools** | Exam creation, review and approval; blog, user and report management |

## Getting started

Requires Node.js 24 and a running [meowlish](https://github.com/HDkit/meowlish) gateway (local or remote).

```bash
npm ci
cp .env.local.example .env.local   # then set NEXT_PUBLIC_API_URL
npm run dev                        # http://localhost:6767
```

To work against the hosted backend instead of a local one, set `NEXT_PUBLIC_API_URL=https://meowlish.servebeer.com`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 6767 |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run share` | Deploys your working copy, uncommitted changes included, to [meowlish-fe-share.vercel.app](https://meowlish-fe-share.vercel.app) |

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Gateway origin that `/api` and `/socket.io` are proxied to. Read at build time. |
| `NEXT_PUBLIC_AI_SERVICE_OPERATIONAL` | `true` hides the "AI services paused" notice |
| `NEXT_PUBLIC_DEMO_ACCOUNT` | `false` hides the demo-account button |
| `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` | Override the demo credentials |

See `.env.local.example` for the full list.

## Deployment

| Trigger | Target | URL |
|---|---|---|
| Push to `main` | Vercel project `meowlish-fe` (production) | [meowlish-fe.vercel.app](https://meowlish-fe.vercel.app) |
| `npm run share` | Vercel project `meowlish-fe-share` | [meowlish-fe-share.vercel.app](https://meowlish-fe-share.vercel.app) |

**CI/CD** (`.github/workflows/deploy.yml`): every push to `main` runs the tests, builds with `vercel build --prod` and ships the result with `vercel deploy --prebuilt --prod`. It needs the repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. `NEXT_PUBLIC_API_URL` comes from the Vercel project's Production environment. You can also start it by hand from the Actions tab.

**`npm run share`** needs `npx vercel login` once, or a `VERCEL_TOKEN` in `.env.vercel` (see `.env.vercel.example`). It deploys to a separate project, so it never replaces the main site, and it prints only the stable URL. Each deploy also gets its own long URL, but that one sits behind Vercel login and the gateway refuses logins from it.

> [!IMPORTANT]
> The gateway only accepts logins from origins listed in its `CORS_ORIGINS`. A new frontend domain has to be added there (in the backend's `docker/.env.services`) before login works on it.

## Backend (API) connection

The browser never calls the backend host directly. Every API call goes to this app's own
origin (`/api/v1/...`, `/socket.io/...`) and `next.config.ts` rewrites it to the backend
gateway. That keeps the gateway's `SameSite=Lax` HttpOnly session cookies first-party: a
frontend on one host and the API on another (e.g. two `*.servebeer.com` / `*.ddns.net`
hosts, which are public suffixes and so different sites) would never store or send them.

- `NEXT_PUBLIC_API_URL`: the gateway origin the rewrites forward to (default
  `https://meowlish.servebeer.com`, locally `http://localhost:3000`; a trailing `/api` is
  ignored). Rewrites are baked in at build time, so set it before `npm run build`.
- `/api/:path*` -> `<NEXT_PUBLIC_API_URL>/api/:path*`. This includes the Google OAuth
  callback `/api/v1/auth/google/callback`, so no page may be added under `src/app/api/v1/auth/google/`.
  The gateway's `BASE_URL` must be this frontend's public origin, and its `CORS_ORIGINS` must
  list it (the browser still sends `Origin: <frontend>`, which the gateway checks).
- `/socket.io/:path*` -> `<NEXT_PUBLIC_API_URL>/api/v1/chat/ws/socket.io/:path*` (chat).
  The client starts with long-polling, which works through any HTTP proxy, and upgrades to
  WebSocket only when the proxy forwards upgrades. In production put a reverse proxy
  (nginx/Envoy) in front that routes `/api` and `/socket.io` (with WebSocket upgrades) straight
  to the gateway and sets `X-Forwarded-For`; Next's built-in proxy doesn't add it.

## Project structure

```
src/
├── app/            Next.js App Router: (app)/ signed-in pages, auth/, landing/, changelog/
├── components/     Page components and shared UI (ui/ is shadcn/ui on Radix)
├── lib/            API client, auth session, Redux store, hooks, small tested helpers
├── services/       Browser-side speech, audio and AI service wrappers
└── middleware.ts   Redirects signed-out visitors away from protected routes
public/             Logos, fonts and landing photos
scripts/            Vercel deploy helpers behind `npm run share`
```

For the Speaking module (speech recognition, Whisper, Gemini) see [SPEAKING_SETUP.md](SPEAKING_SETUP.md).

## Credits

Started from a [Figma Make](https://www.figma.com/design/PHZXpxzL3v5LSpH4IRCSvB/AI-English-Exam-Prep-System) export. UI components are from [shadcn/ui](https://ui.shadcn.com/) (MIT), and photos are from [Unsplash](https://unsplash.com) under the [Unsplash license](https://unsplash.com/license). See [src/Attributions.md](src/Attributions.md).
