
  # AI English Exam Prep System

  This is a code bundle for AI English Exam Prep System. The original project is available at https://www.figma.com/design/PHZXpxzL3v5LSpH4IRCSvB/AI-English-Exam-Prep-System.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
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
