/**
 * Frontend public config.
 * Paste Google Maps browser key into .env.local — never commit real keys.
 */
export const appConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000/realtime',
  googleMapsBrowserKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  googleMapsMapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
  /** Kept for compatibility; live fleet now uses auth token + companyId automatically. */
  useLiveApi: process.env.NEXT_PUBLIC_USE_LIVE_API !== 'false',
  defaultCompanyId: process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID ?? '',
};

export function isGoogleMapsEnabled(): boolean {
  return appConfig.googleMapsBrowserKey.trim().length > 0;
}

/** Free ngrok serves an HTML interstitial (ERR_NGROK_6024) unless this header is set. */
export function isNgrokUrl(url: string): boolean {
  return /ngrok/i.test(url);
}

export function withNgrokSkipBrowserWarning(
  headers: Headers | Record<string, string> = {},
): Headers {
  const next = headers instanceof Headers ? headers : new Headers(headers);
  if (isNgrokUrl(appConfig.apiUrl) || isNgrokUrl(appConfig.wsUrl)) {
    next.set('ngrok-skip-browser-warning', 'true');
  }
  return next;
}

export function ngrokSocketExtraHeaders(): Record<string, string> | undefined {
  if (!isNgrokUrl(appConfig.wsUrl)) return undefined;
  return { 'ngrok-skip-browser-warning': 'true' };
}

export function apiOrigin(): string {
  return appConfig.apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

/** Turn `/uploads/…` or absolute URLs into a browser-loadable URL. */
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${apiOrigin()}${url}`;
  return `${apiOrigin()}/${url.replace(/^\/+/, '')}`;
}
