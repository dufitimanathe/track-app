import { apiFetch } from '@/lib/api/client';
import type { FleetStatus, GpsStatus, Motorcycle } from '@/types';

export type LocationFreshness = 'LIVE' | 'DELAYED' | 'OFFLINE';

export interface FleetLiveItem {
  motorcycleId: string;
  plateNumber: string;
  status: string;
  trackingStatus: string;
  riderId?: string | null;
  riderName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  recordedAt?: string | null;
  freshness: LocationFreshness;
}

export interface LocationUpdatePayload {
  motorcycleId: string;
  companyId: string;
  riderId?: string | null;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  source: string;
  recordedAt: string;
  trackingStatus: string;
  freshness: LocationFreshness;
}

function mapBackendStatus(status: string, trackingStatus: string): FleetStatus {
  const s = status.toUpperCase();
  if (s.includes('MAINTENANCE')) return 'maintenance';
  if (trackingStatus?.toUpperCase().includes('UNAUTHORIZED')) return 'unauthorized';
  if (s.includes('ON_TRIP') || s.includes('IN_USE')) return 'on_trip';
  if (s.includes('ASSIGNED') || s.includes('RESERVED')) return 'assigned';
  if (s.includes('OFFLINE') || s.includes('INACTIVE')) return 'offline';
  return 'available';
}

function mapFreshness(freshness: LocationFreshness): GpsStatus {
  if (freshness === 'LIVE') return 'online';
  if (freshness === 'DELAYED') return 'delayed';
  return 'offline';
}

/** Map Nest fleet/live DTO → existing Motorcycle UI type. */
export function fleetLiveToMotorcycle(item: FleetLiveItem): Motorcycle {
  const lat = item.latitude ?? -1.9441;
  const lng = item.longitude ?? 30.0619;
  const freshness = item.freshness ?? 'OFFLINE';

  return {
    id: item.motorcycleId,
    plate: item.plateNumber,
    fleetNumber: item.plateNumber,
    brand: '',
    model: '',
    year: 0,
    color: '',
    status: mapBackendStatus(item.status, item.trackingStatus),
    gpsStatus: mapFreshness(freshness),
    riderId: item.riderId ?? undefined,
    riderName: item.riderName ?? undefined,
    location:
      item.latitude != null && item.longitude != null
        ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
        : 'No fix',
    lat,
    lng,
    speed: item.speed ?? 0,
    tripsToday: 0,
    distanceTodayKm: 0,
    lastSeen: item.recordedAt
      ? new Date(item.recordedAt).toLocaleString()
      : 'Never',
    heading: item.heading ?? undefined,
  };
}

export function fetchLiveFleet(companyId: string): Promise<FleetLiveItem[]> {
  return apiFetch<FleetLiveItem[]>(`/companies/${companyId}/fleet/live`);
}
