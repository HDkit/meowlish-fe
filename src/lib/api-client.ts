import { OpenAPI } from './api/core/OpenAPI';

// Initialize the automatically generated OpenAPI client configuration
export function setupApiClient() {
  // Since we configured a proxy in next.config.ts, we use the same origin
  // This bypasses any CORS issues that would prevent the browser from hitting the backend directly.
  OpenAPI.BASE = '';
  
  // Example: Setting a default token strategy from localStorage if running in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      OpenAPI.TOKEN = token;
    }
  }

  // Intercept authentication errors or configure credentials if needed
  OpenAPI.WITH_CREDENTIALS = true;

  console.log('API Client setup with base URL:', OpenAPI.BASE);
}

// Function to update the token after login/refresh
export function setApiToken(token: string) {
  OpenAPI.TOKEN = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

// Function to remove token on logout
export function clearApiToken() {
  OpenAPI.TOKEN = undefined;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

// Export everything from the generated API so you can use this file as the central import point
export * from './api';
