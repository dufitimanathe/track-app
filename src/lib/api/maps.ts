import { apiFetch } from '@/lib/api/client';

export interface MapsStatus {
  provider: 'google' | 'haversine';
  googleConfigured: boolean;
  trackingMode: 'phone_primary' | 'hardware_primary' | 'hybrid';
  routeDeviationThresholdMeters: number;
  notes: string[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
  legs?: Array<{ distanceMeters: number; durationSeconds: number }>;
}

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
  formattedAddress?: string;
}

export function fetchMapsStatus(): Promise<MapsStatus> {
  return apiFetch<MapsStatus>('/maps/status');
}

export function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  return apiFetch<GeocodeResult | null>('/maps/geocode', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export function calculateRoute(
  origin: GeoPoint,
  destination: GeoPoint,
): Promise<RouteResult> {
  return apiFetch<RouteResult>('/maps/route', {
    method: 'POST',
    body: JSON.stringify({ origin, destination }),
  });
}

export function checkRouteDeviation(input: {
  point: GeoPoint;
  encodedPolyline: string;
  thresholdMeters?: number;
}): Promise<{ offRoute: boolean; distanceMeters: number; thresholdMeters: number }> {
  return apiFetch('/maps/route-deviation', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
