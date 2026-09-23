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
