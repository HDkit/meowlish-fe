import { OpenAPI } from './api/core/OpenAPI';
import {
  clearApiTokens,
  getAccessToken,
  getApiBaseUrl,
  setApiTokens,
} from './api/auth-session';

// Initialize the automatically generated OpenAPI client configuration
export function setupApiClient() {
  OpenAPI.BASE = getApiBaseUrl();
  OpenAPI.TOKEN = async () => getAccessToken() ?? '';
  OpenAPI.WITH_CREDENTIALS = false;

  console.log('API Client setup with base URL:', OpenAPI.BASE);
}

// Function to update the token after login/refresh
export function setApiTokensState(accessToken: string, refreshToken?: string) {
  setApiTokens(accessToken, refreshToken);
  OpenAPI.TOKEN = async () => getAccessToken() ?? '';
}

export function setApiToken(token: string) {
  setApiTokensState(token);
}

// Function to remove token on logout
export function clearApiToken() {
  clearApiTokens();
  OpenAPI.TOKEN = async () => getAccessToken() ?? '';
}

// Export everything from the generated API so you can use this file as the central import point
export * from './api';
export * from './api/auth-session';
