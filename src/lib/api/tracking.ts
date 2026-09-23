import { apiFetch } from '@/lib/api/client';

export type TrackingMovementState =
  | 'OFF_DUTY'
  | 'READY'
  | 'TRACKING'
  | 'MOVING'
  | 'STOPPED'
  | 'OFFLINE'
  | 'TRIP_COMPLETED'
  | string;

export type TrackingPresenceState = 'LIVE' | 'DELAYED' | 'STALE' | 'OFFLINE' | string;

export type GeofenceType =
  | 'HEAD_OFFICE'
  | 'WAREHOUSE'
  | 'CUSTOMER'
  | 'PARKING'
  | 'DEPOT'
  | 'CHECKPOINT'
  | 'DELIVERY_ZONE'
  | 'OTHER';

export interface LiveDriverStateDto {
  riderId: string;
  motorcycleId: string;
  companyId: string;
  trackingSessionId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  movementState: TrackingMovementState;
  presence: TrackingPresenceState;
  capturedAt: string;
  receivedAt: string;
  totalDistanceMeters: number;
  riderName?: string | null;
  phone?: string | null;
  plateNumber?: string | null;
  placeName?: string | null;
  sessionHealth?: 'ACTIVE' | 'STALE' | 'STOPPED' | null;
}

export interface TrackingCompanyStatsDto {
  activeDrivers: number;
  movingDrivers: number;
  stoppedDrivers: number;
  offlineDrivers: number;
  delayedDrivers: number;
  activeMotorcycles: number;
  totalKilometresToday: number;
}

export interface TrackingSessionDto {
  id: string;
  companyId: string;
  riderId: string;
  motorcycleId: string;
  tripId?: string | null;
  status: string;
  movementState: TrackingMovementState;
  startedAt: string;
  endedAt?: string | null;
  lastLocationAt?: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  totalDistanceMeters: number;
  movingDurationSeconds: number;
  stoppedDurationSeconds: number;
  maxSpeed?: number | null;
  averageSpeed?: number | null;
  startAddress?: string | null;
  endAddress?: string | null;
}

export interface SessionRoutePointDto {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  capturedAt: string;
}

export interface DriverStopDto {
  id: string;
  riderId: string;
  motorcycleId: string;
  trackingSessionId: string;
  latitude: number;
  longitude: number;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds?: number | null;
  address?: string | null;
}

export interface SessionRouteDto {
  route: SessionRoutePointDto[];
  stops: DriverStopDto[];
}

export interface RiderTrackingStatsDto {
  distanceTodayMeters: number;
  distanceWeekMeters: number;
  distanceMonthMeters: number;
  activeHours: number;
  movingHours: number;
  stoppedHours: number;
  tripCount: number;
}

export interface GeofenceDto {
  id: string;
  companyId: string;
  name: string;
  type: GeofenceType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGeofencePayload {
  name: string;
  type: GeofenceType;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface UpdateGeofencePayload {
  name?: string;
  type?: GeofenceType;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  active?: boolean;
}

export function fetchTrackingLive(companyId: string) {
  return apiFetch<LiveDriverStateDto[]>(`/companies/${companyId}/tracking/live`);
}

export function fetchTrackingStats(companyId: string) {
  return apiFetch<TrackingCompanyStatsDto>(
    `/companies/${companyId}/tracking/statistics`,
  );
}

export function fetchSessionRoute(companyId: string, sessionId: string) {
  return apiFetch<SessionRouteDto>(
    `/companies/${companyId}/tracking/sessions/${sessionId}/route`,
  );
}

export function fetchTrackingSessions(
  companyId: string,
  query?: {
    riderId?: string;
    motorcycleId?: string;
    from?: string;
    to?: string;
  },
) {
  const params = new URLSearchParams();
  if (query?.riderId) params.set('riderId', query.riderId);
  if (query?.motorcycleId) params.set('motorcycleId', query.motorcycleId);
  if (query?.from) params.set('from', query.from);
  if (query?.to) params.set('to', query.to);
  const qs = params.toString();
  return apiFetch<TrackingSessionDto[]>(
    `/companies/${companyId}/tracking/sessions${qs ? `?${qs}` : ''}`,
  );
}

export function fetchRiderTrackingStats(companyId: string, riderId: string) {
  return apiFetch<RiderTrackingStatsDto>(
    `/companies/${companyId}/tracking/drivers/${riderId}/statistics`,
  );
}

export function fetchGeofences(companyId: string) {
  return apiFetch<GeofenceDto[]>(`/companies/${companyId}/tracking/geofences`);
}

export function createGeofence(companyId: string, payload: CreateGeofencePayload) {
  return apiFetch<GeofenceDto>(`/companies/${companyId}/tracking/geofences`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateGeofence(
  companyId: string,
  geofenceId: string,
  payload: UpdateGeofencePayload,
) {
  return apiFetch<GeofenceDto>(
    `/companies/${companyId}/tracking/geofences/${geofenceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deleteGeofence(companyId: string, geofenceId: string) {
  return apiFetch<{ deleted: boolean }>(
    `/companies/${companyId}/tracking/geofences/${geofenceId}`,
    { method: 'DELETE' },
  );
}
