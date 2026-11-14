import { OpenAPI } from './api/core/OpenAPI';
import { getApiBaseUrl, purgeLegacyTokens } from './api/auth-session';

// Initialize the automatically generated OpenAPI client configuration.
// Auth travels in HttpOnly cookies set by the gateway, so no token is configured here:
// every request is sent with `credentials: 'include'`.
let legacyPurged = false;

export function setupApiClient() {
  if (!legacyPurged) {
    legacyPurged = true;
    purgeLegacyTokens();
  }
  // '' = same origin: /api/v1/... goes through the Next.js rewrite to the gateway (next.config.ts).
  OpenAPI.BASE = getApiBaseUrl();
  OpenAPI.TOKEN = undefined;
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';
}

// Export everything from the generated API so you can use this file as the central import point
export * from './api';
export * from './api/auth-session';
