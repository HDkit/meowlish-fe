#!/usr/bin/env bash
# One-command deploy of this working copy to Vercel (uncommitted changes included).
#
#   npm run share              -> https://meowlish-fe-share.vercel.app (same URL every run)
#   npm run share -- --preview -> preview deploy, unique URL per run (behind Vercel login by default)
#
# It deploys to its own Vercel project, meowlish-fe-share, so it never replaces main's production
# site (https://meowlish-fe.vercel.app, deployed by .github/workflows/deploy.yml on push to main).
# Override the target with VERCEL_ORG_ID / VERCEL_PROJECT_ID in .env.vercel.
#
# Auth: VERCEL_TOKEN from the environment or from .env.vercel (gitignored); otherwise falls back
# to the credentials saved by `npx vercel login`.
#
# Backend: Vercel runs the /api/* rewrite in next.config.ts on its servers, so the gateway must be
# publicly reachable. Set VERCEL_API_URL (in .env.vercel or the shell) to override the default.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env.vercel ]]; then
	set -a
	# shellcheck disable=SC1091
	source .env.vercel
	set +a
fi

API_URL="${VERCEL_API_URL:-https://meowlish.servebeer.com}"
# The CLI uses these over .vercel/project.json when both are set.
export VERCEL_ORG_ID="${VERCEL_ORG_ID:-team_KOl9HogPLxsn2lFBiQMIY2Cz}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-prj_SOtvcGDZlMNkDzzPWsqP6gOA9HkR}"
if [[ "$API_URL" =~ ://(localhost|127\.0\.0\.1|0\.0\.0\.0)([:/]|$) ]]; then
	echo "VERCEL_API_URL=$API_URL is local to this machine; Vercel cannot reach it." >&2
	echo "Use a public gateway URL (or tunnel the local gateway and use that URL)." >&2
	exit 1
fi

target=(--prod)
if [[ "${1:-}" == "--preview" ]]; then
	target=()
	shift
fi

auth=()
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
	auth=(--token "$VERCEL_TOKEN")
fi
scope=()
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
	scope=(--scope "$VERCEL_SCOPE")
fi

echo "Deploying to Vercel (API -> $API_URL)..." >&2
# --yes: link/create the project with defaults on the first run, no prompts.
# --build-env: NEXT_PUBLIC_API_URL is read at build time (rewrites are baked into the build).
out="$(npx --yes vercel@65.15.0 deploy --yes "${target[@]}" "${auth[@]}" "${scope[@]}" \
	--build-env NEXT_PUBLIC_API_URL="$API_URL" \
	"$@")"
url="$(node scripts/vercel-url.mjs <<<"$out")"

echo >&2
if [[ ${#target[@]} -gt 0 ]]; then
	live="$(node scripts/vercel-url.mjs --production <<<"$out")"
	echo "Live: $live  (this deploy: $url)" >&2
	echo "$live"
else
	echo "Preview: $url" >&2
	echo "$url"
fi
