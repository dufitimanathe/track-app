'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import {
  fetchLiveFleet,
  fleetLiveToMotorcycle,
  type LocationUpdatePayload,
} from '@/lib/api/locations';
import { appConfig } from '@/lib/config';
import { useAppSelector } from '@/store';
import type { Motorcycle } from '@/types';

export type LiveFleetSource = 'api' | 'empty';

export interface LiveFleetStats {
  online: number;
  moving: number;
  available: number;
  onTrip: number;
  offline: number;
  incidents: number;
}

function computeStats(items: Motorcycle[]): LiveFleetStats {
  return {
    online: items.filter((m) => m.gpsStatus === 'online' || m.gpsStatus === 'delayed').length,
    moving: items.filter((m) => m.speed > 2).length,
    available: items.filter((m) => m.status === 'available').length,
    onTrip: items.filter((m) => m.status === 'on_trip').length,
    offline: items.filter((m) => m.status === 'offline' || m.gpsStatus === 'offline').length,
    incidents: items.filter((m) => m.status === 'unauthorized').length,
  };
}

/** Live fleet snapshot + Socket.IO when authenticated with a company. */
export function useLiveFleet(companyId?: string) {
  const authCompanyId = useAppSelector((s) => s.auth.companyId);
  const resolvedCompanyId = companyId || authCompanyId || appConfig.defaultCompanyId;
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const canUseApi = Boolean(resolvedCompanyId && token);

  const [source, setSource] = useState<LiveFleetSource>('empty');
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!canUseApi || !resolvedCompanyId) {
      setSource('empty');
      setMotorcycles([]);
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const items = await fetchLiveFleet(resolvedCompanyId);
      setMotorcycles(items.map(fleetLiveToMotorcycle));
      setSource('api');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live fleet');
      setMotorcycles([]);
      setSource('empty');
    } finally {
      setConnecting(false);
    }
  }, [canUseApi, resolvedCompanyId]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!canUseApi || !resolvedCompanyId) return;
    const access = getAccessToken();
    if (!access) return;

    let socket: Socket | null = null;
    try {
      socket = io(appConfig.wsUrl, {
        auth: { token: access },
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
      socket.on('connect', () => {
        socket?.emit('joinCompany', { companyId: resolvedCompanyId });
      });
      socket.on('fleet.location.updated', (payload: LocationUpdatePayload) => {
        setMotorcycles((prev) => {
          const idx = prev.findIndex((m) => m.id === payload.motorcycleId);
          if (idx < 0) return prev;
          const next = [...prev];
          const current = next[idx];
          next[idx] = {
            ...current,
            lat: payload.latitude,
            lng: payload.longitude,
            speed: payload.speed ?? 0,
            heading: payload.heading ?? current.heading,
            gpsStatus:
              payload.freshness === 'LIVE'
                ? 'online'
                : payload.freshness === 'DELAYED'
                  ? 'delayed'
                  : 'offline',
            location: `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
            lastSeen: new Date(payload.recordedAt).toLocaleString(),
            riderId: payload.riderId ?? current.riderId,
          };
          return next;
        });
      });
    } catch {
      // optional
    }

    return () => {
      socket?.disconnect();
    };
  }, [canUseApi, resolvedCompanyId]);

  const stats = useMemo(() => computeStats(motorcycles), [motorcycles]);

  return {
    motorcycles,
    stats,
    source,
    connecting,
    error,
    refresh: loadSnapshot,
    trackingHint:
      source === 'api'
        ? 'Live from Nest /fleet/live'
        : error
          ? error
          : 'Sign in to load live fleet',
  };
}
