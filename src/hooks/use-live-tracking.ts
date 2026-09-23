'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';
import type { LocationUpdatePayload } from '@/lib/api/locations';
import {
  fetchRiderTrackingStats,
  fetchSessionRoute,
  fetchTrackingLive,
  fetchTrackingStats,
  type LiveDriverStateDto,
  type TrackingCompanyStatsDto,
} from '@/lib/api/tracking';
import { appConfig, ngrokSocketExtraHeaders } from '@/lib/config';
import {
  classifyGpsQuality,
  type GpsQuality,
} from '@/lib/gps-quality';
import { useAppSelector } from '@/store';

export type TrackingConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export type LiveMarkerStatus =
  | 'moving'
  | 'stopped'
  | 'delayed'
  | 'offline'
  | 'poor_gps'
  | 'stale';

export interface LiveRiderState extends LiveDriverStateDto {
  markerStatus: LiveMarkerStatus;
  gpsQuality: GpsQuality;
  distanceTodayMeters: number;
}

export interface TrackingActivityItem {
  id: string;
  type:
    | 'session-started'
    | 'session-ended'
    | 'geofence-enter'
    | 'geofence-exit'
    | 'driver-offline'
    | 'driver-online'
    | 'gps-warning'
    | 'status';
  title: string;
  subtitle?: string;
  riderId?: string;
  at: string;
}

export interface TrackingLiveStats {
  active: number;
  moving: number;
  stopped: number;
  delayed: number;
  offline: number;
  distanceTodayKm: number;
}

const MAX_POLYLINE_POINTS = 2000;
const MAX_ACTIVITY = 80;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

function deriveMarkerStatus(state: {
  presence: string;
  movementState: string;
  accuracy: number | null;
  speed: number | null;
  capturedAt?: string;
}): LiveMarkerStatus {
  const quality = classifyGpsQuality(state.accuracy, state.capturedAt);
  if (quality === 'stale') return 'stale';
  if (quality === 'very-poor' || quality === 'poor') return 'poor_gps';

  const presence = state.presence?.toUpperCase();
  if (presence === 'OFFLINE') return 'offline';
  if (presence === 'DELAYED' || presence === 'STALE') return 'delayed';
  const movement = state.movementState?.toUpperCase();
  if (movement === 'STOPPED') return 'stopped';
  if (movement === 'MOVING') return 'moving';
  if ((state.speed ?? 0) > 0.5) return 'moving';
  return 'stopped';
}

function toLiveRider(
  dto: LiveDriverStateDto,
  todayMeters = 0,
): LiveRiderState {
  return {
    ...dto,
    markerStatus: deriveMarkerStatus(dto),
    gpsQuality: classifyGpsQuality(dto.accuracy, dto.capturedAt),
    distanceTodayMeters: todayMeters,
  };
}

function pushActivity(
  prev: TrackingActivityItem[],
  item: Omit<TrackingActivityItem, 'id'> & { id?: string },
): TrackingActivityItem[] {
  const next: TrackingActivityItem = {
    id: item.id ?? `${item.type}-${item.at}-${item.riderId ?? 'x'}-${Math.random().toString(36).slice(2, 7)}`,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    riderId: item.riderId,
    at: item.at,
  };
  return [next, ...prev].slice(0, MAX_ACTIVITY);
}

function appendPoint(
  path: Array<{ lat: number; lng: number }>,
  lat: number,
  lng: number,
): Array<{ lat: number; lng: number }> {
  const last = path[path.length - 1];
  if (last && Math.abs(last.lat - lat) < 1e-6 && Math.abs(last.lng - lng) < 1e-6) {
    return path;
  }
  const next = [...path, { lat, lng }];
  return next.length > MAX_POLYLINE_POINTS
    ? next.slice(next.length - MAX_POLYLINE_POINTS)
    : next;
}

/** Live rider tracking: REST snapshot + Socket.IO company room updates. */
export function useLiveTracking(companyId?: string) {
  const authCompanyId = useAppSelector((s) => s.auth.companyId);
  const resolvedCompanyId = companyId || authCompanyId || appConfig.defaultCompanyId;
  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const canUseApi = Boolean(resolvedCompanyId && token);

  const [riders, setRiders] = useState<Record<string, LiveRiderState>>({});
  const [connectionState, setConnectionState] =
    useState<TrackingConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [followMode, setFollowMode] = useState(false);
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const [activity, setActivity] = useState<TrackingActivityItem[]>([]);
  const [apiStats, setApiStats] = useState<TrackingCompanyStatsDto | null>(null);
  const [riderStatsCache, setRiderStatsCache] = useState<
    Record<string, { distanceTodayMeters: number }>
  >({});

  const socketRef = useRef<Socket | null>(null);
  const backoffRef = useRef(BACKOFF_BASE_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRiderIdRef = useRef<string | null>(null);
  const followModeRef = useRef(false);

  useEffect(() => {
    selectedRiderIdRef.current = selectedRiderId;
  }, [selectedRiderId]);

  useEffect(() => {
    followModeRef.current = followMode;
  }, [followMode]);

  // Reclassify GPS quality / stale markers without waiting for the next socket ping.
  useEffect(() => {
    const timer = setInterval(() => {
      setRiders((prev) => {
        let changed = false;
        const next: Record<string, LiveRiderState> = {};
        for (const [id, rider] of Object.entries(prev)) {
          const gpsQuality = classifyGpsQuality(rider.accuracy, rider.capturedAt);
          const markerStatus = deriveMarkerStatus(rider);
          if (gpsQuality !== rider.gpsQuality || markerStatus !== rider.markerStatus) {
            changed = true;
            next[id] = { ...rider, gpsQuality, markerStatus };
          } else {
            next[id] = rider;
          }
        }
        return changed ? next : prev;
      });
    }, 5_000);
    return () => clearInterval(timer);
  }, []);

  const riderStatsCacheRef = useRef(riderStatsCache);
  useEffect(() => {
    riderStatsCacheRef.current = riderStatsCache;
  }, [riderStatsCache]);

  const loadSnapshot = useCallback(async () => {
    if (!canUseApi || !resolvedCompanyId) {
      setRiders({});
      setApiStats(null);
      return;
    }

    setError(null);
    try {
      const [live, stats] = await Promise.all([
        fetchTrackingLive(resolvedCompanyId),
        fetchTrackingStats(resolvedCompanyId).catch(() => null),
      ]);
      setApiStats(stats);
      setRiders((prev) => {
        const next: Record<string, LiveRiderState> = {};
        for (const dto of live) {
          const existing = prev[dto.riderId];
          next[dto.riderId] = toLiveRider(
            dto,
            existing?.distanceTodayMeters ??
              riderStatsCacheRef.current[dto.riderId]?.distanceTodayMeters ??
              0,
          );
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live tracking');
    }
  }, [canUseApi, resolvedCompanyId]);

  const loadSnapshotRef = useRef(loadSnapshot);
  useEffect(() => {
    loadSnapshotRef.current = loadSnapshot;
  }, [loadSnapshot]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!canUseApi || !resolvedCompanyId) return;
    const access = getAccessToken();
    if (!access) return;

    let cancelled = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      clearReconnectTimer();
      setConnectionState('reconnecting');
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, BACKOFF_MAX_MS);
      reconnectTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        socketRef.current?.connect();
      }, delay);
    };

    const socket = io(appConfig.wsUrl, {
      auth: { token: access },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: false,
      extraHeaders: ngrokSocketExtraHeaders(),
    });
    socketRef.current = socket;
    setConnectionState('reconnecting');

    socket.on('connect', () => {
      backoffRef.current = BACKOFF_BASE_MS;
      setConnectionState('connected');
      socket.emit('joinCompany', { companyId: resolvedCompanyId });
      void loadSnapshotRef.current();
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
      scheduleReconnect();
    });

    socket.on('connect_error', () => {
      setConnectionState('disconnected');
      scheduleReconnect();
    });

    const patchRider = (
      riderId: string,
      patch: Partial<LiveDriverStateDto> & {
        distanceTodayMeters?: number;
      },
    ) => {
      setRiders((prev) => {
        const current = prev[riderId];
        if (!current && patch.latitude == null) return prev;
        const merged: LiveDriverStateDto = {
          riderId,
          motorcycleId: patch.motorcycleId ?? current?.motorcycleId ?? '',
          companyId: patch.companyId ?? current?.companyId ?? resolvedCompanyId,
          trackingSessionId:
            patch.trackingSessionId ?? current?.trackingSessionId ?? '',
          latitude: patch.latitude ?? current?.latitude ?? 0,
          longitude: patch.longitude ?? current?.longitude ?? 0,
          speed: patch.speed !== undefined ? patch.speed : (current?.speed ?? null),
          heading:
            patch.heading !== undefined ? patch.heading : (current?.heading ?? null),
          accuracy:
            patch.accuracy !== undefined ? patch.accuracy : (current?.accuracy ?? null),
          movementState:
            patch.movementState ?? current?.movementState ?? 'TRACKING',
          presence: patch.presence ?? current?.presence ?? 'LIVE',
          capturedAt: patch.capturedAt ?? current?.capturedAt ?? new Date().toISOString(),
          receivedAt: patch.receivedAt ?? current?.receivedAt ?? new Date().toISOString(),
          totalDistanceMeters:
            patch.totalDistanceMeters ?? current?.totalDistanceMeters ?? 0,
          riderName:
            patch.riderName !== undefined ? patch.riderName : (current?.riderName ?? null),
          phone: patch.phone !== undefined ? patch.phone : (current?.phone ?? null),
          plateNumber:
            patch.plateNumber !== undefined
              ? patch.plateNumber
              : (current?.plateNumber ?? null),
          placeName:
            patch.placeName !== undefined
              ? patch.placeName
              : (current?.placeName ?? null),
          sessionHealth:
            patch.sessionHealth !== undefined
              ? patch.sessionHealth
              : (current?.sessionHealth ?? null),
        };
        return {
          ...prev,
          [riderId]: toLiveRider(
            merged,
            patch.distanceTodayMeters ?? current?.distanceTodayMeters ?? 0,
          ),
        };
      });
    };

    socket.on('tracking.driver-location', (payload: LiveDriverStateDto) => {
      if (!payload?.riderId) return;
      patchRider(payload.riderId, payload);
      if (selectedRiderIdRef.current === payload.riderId) {
        setRoutePath((prev) =>
          appendPoint(prev, payload.latitude, payload.longitude),
        );
      }
    });

    socket.on('fleet.location.updated', (payload: LocationUpdatePayload) => {
      if (!payload?.riderId) return;
      patchRider(payload.riderId, {
        riderId: payload.riderId,
        motorcycleId: payload.motorcycleId,
        companyId: payload.companyId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        speed: payload.speed ?? null,
        heading: payload.heading ?? null,
        accuracy: payload.accuracy ?? null,
        presence: payload.freshness,
        capturedAt:
          typeof payload.recordedAt === 'string'
            ? payload.recordedAt
            : new Date(payload.recordedAt).toISOString(),
        receivedAt: new Date().toISOString(),
      });
      if (selectedRiderIdRef.current === payload.riderId) {
        setRoutePath((prev) =>
          appendPoint(prev, payload.latitude, payload.longitude),
        );
      }
    });

    socket.on(
      'tracking.driver-status',
      (payload: {
        riderId: string;
        motorcycleId?: string;
        presence?: string;
        movementState?: string;
      }) => {
        if (!payload?.riderId) return;
        patchRider(payload.riderId, {
          riderId: payload.riderId,
          motorcycleId: payload.motorcycleId,
          presence: payload.presence,
          movementState: payload.movementState,
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'status',
            title: `Status → ${payload.presence ?? payload.movementState ?? 'updated'}`,
            riderId: payload.riderId,
            at: new Date().toISOString(),
          }),
        );
      },
    );

    socket.on(
      'tracking.session-started',
      (payload: {
        sessionId: string;
        riderId: string;
        motorcycleId: string;
        startedAt: string;
        riderName?: string | null;
        plateNumber?: string | null;
      }) => {
        patchRider(payload.riderId, {
          riderId: payload.riderId,
          motorcycleId: payload.motorcycleId,
          trackingSessionId: payload.sessionId,
          riderName: payload.riderName,
          plateNumber: payload.plateNumber,
          presence: 'LIVE',
          movementState: 'TRACKING',
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'session-started',
            title: 'Session started',
            subtitle: payload.riderName ?? payload.plateNumber ?? undefined,
            riderId: payload.riderId,
            at: payload.startedAt ?? new Date().toISOString(),
          }),
        );
      },
    );

    socket.on(
      'tracking.session-ended',
      (payload: {
        sessionId: string;
        riderId: string;
        motorcycleId: string;
        endedAt: string;
        totalDistanceMeters?: number;
      }) => {
        patchRider(payload.riderId, {
          riderId: payload.riderId,
          motorcycleId: payload.motorcycleId,
          trackingSessionId: '',
          totalDistanceMeters: payload.totalDistanceMeters,
          movementState: 'TRIP_COMPLETED',
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'session-ended',
            title: 'Session ended',
            subtitle:
              payload.totalDistanceMeters != null
                ? `${(payload.totalDistanceMeters / 1000).toFixed(1)} km`
                : undefined,
            riderId: payload.riderId,
            at: payload.endedAt ?? new Date().toISOString(),
          }),
        );
      },
    );

    socket.on(
      'tracking.driver-offline',
      (payload: { riderId: string; motorcycleId?: string }) => {
        if (!payload?.riderId) return;
        patchRider(payload.riderId, {
          riderId: payload.riderId,
          motorcycleId: payload.motorcycleId,
          presence: 'OFFLINE',
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'driver-offline',
            title: 'Driver went offline',
            riderId: payload.riderId,
            at: new Date().toISOString(),
          }),
        );
      },
    );

    socket.on(
      'tracking.driver-online',
      (payload: { riderId: string; motorcycleId?: string }) => {
        if (!payload?.riderId) return;
        patchRider(payload.riderId, {
          riderId: payload.riderId,
          motorcycleId: payload.motorcycleId,
          presence: 'LIVE',
        });
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'driver-online',
            title: 'Driver online',
            riderId: payload.riderId,
            at: new Date().toISOString(),
          }),
        );
      },
    );

    const onGeofence = (
      type: 'geofence-enter' | 'geofence-exit',
      payload: {
        geofenceId?: string;
        geofenceName?: string | null;
        riderId: string;
        motorcycleId?: string;
        occurredAt?: string;
      },
    ) => {
      setActivity((prev) =>
        pushActivity(prev, {
          type,
          title: type === 'geofence-enter' ? 'Entered geofence' : 'Exited geofence',
          subtitle: payload.geofenceName ?? undefined,
          riderId: payload.riderId,
          at: payload.occurredAt ?? new Date().toISOString(),
        }),
      );
    };

    socket.on('tracking.geofence-enter', (p) => onGeofence('geofence-enter', p));
    socket.on('tracking.geofence-exit', (p) => onGeofence('geofence-exit', p));

    socket.on(
      'tracking.gps-warning',
      (payload: { riderId?: string; message?: string; at?: string }) => {
        setActivity((prev) =>
          pushActivity(prev, {
            type: 'gps-warning',
            title: 'GPS warning',
            subtitle: payload.message,
            riderId: payload.riderId,
            at: payload.at ?? new Date().toISOString(),
          }),
        );
      },
    );

    return () => {
      cancelled = true;
      clearReconnectTimer();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnectionState('disconnected');
    };
  }, [canUseApi, resolvedCompanyId]);

  const selectRider = useCallback(
    async (riderId: string | null) => {
      setSelectedRiderId(riderId);
      if (!riderId) {
        setRoutePath([]);
        setFollowMode(false);
        return;
      }

      const rider = riders[riderId];
      const sessionId = rider?.trackingSessionId;
      if (rider) {
        setRoutePath([{ lat: rider.latitude, lng: rider.longitude }]);
      } else {
        setRoutePath([]);
      }

      if (!resolvedCompanyId) return;

      try {
        const stats = await fetchRiderTrackingStats(resolvedCompanyId, riderId);
        setRiderStatsCache((prev) => ({
          ...prev,
          [riderId]: { distanceTodayMeters: stats.distanceTodayMeters },
        }));
        setRiders((prev) => {
          const current = prev[riderId];
          if (!current) return prev;
          return {
            ...prev,
            [riderId]: {
              ...current,
              distanceTodayMeters: stats.distanceTodayMeters,
            },
          };
        });
      } catch {
        // optional
      }

      if (sessionId) {
        try {
          const { route } = await fetchSessionRoute(resolvedCompanyId, sessionId);
          if (route?.length) {
            setRoutePath(
              route.map((p) => ({ lat: p.latitude, lng: p.longitude })),
            );
          }
        } catch {
          // keep current point
        }
      }
    },
    [riders, resolvedCompanyId],
  );

  const ridersList = useMemo(() => Object.values(riders), [riders]);

  const selectedRider = selectedRiderId ? riders[selectedRiderId] ?? null : null;

  const derivedStats = useMemo((): TrackingLiveStats => {
    const list = ridersList;
    return {
      active: list.filter((r) => r.presence !== 'OFFLINE').length,
      moving: list.filter((r) => r.markerStatus === 'moving').length,
      stopped: list.filter((r) => r.markerStatus === 'stopped').length,
      delayed: list.filter((r) => r.markerStatus === 'delayed').length,
      offline: list.filter((r) => r.markerStatus === 'offline').length,
      distanceTodayKm:
        apiStats?.totalKilometresToday ??
        list.reduce((sum, r) => sum + r.distanceTodayMeters, 0) / 1000,
    };
  }, [ridersList, apiStats]);

  const centerRequestRef = useRef(0);
  const [centerToken, setCenterToken] = useState(0);

  const centerOnSelected = useCallback(() => {
    setCenterToken((n) => n + 1);
    centerRequestRef.current += 1;
  }, []);

  return {
    companyId: resolvedCompanyId,
    riders,
    ridersList,
    selectedRiderId,
    selectedRider,
    selectRider,
    followMode,
    setFollowMode,
    routePath,
    activity,
    stats: derivedStats,
    connectionState,
    error,
    refresh: loadSnapshot,
    centerOnSelected,
    centerToken,
  };
}
