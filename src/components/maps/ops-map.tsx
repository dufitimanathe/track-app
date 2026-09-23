'use client';

import { useEffect, useMemo, Fragment } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';
import { isGoogleMapsEnabled, appConfig } from '@/lib/config';
import type { Motorcycle } from '@/types';
import { StatusBadge, StatusDot } from '@/components/ui/status-badge';
import { MapPin, Navigation, Zap } from 'lucide-react';

export type MapMarkerStatus =
  | 'moving'
  | 'stopped'
  | 'delayed'
  | 'offline'
  | 'poor_gps'
  | 'gps_excellent'
  | 'gps_acceptable'
  | 'gps_poor'
  | 'gps_very_poor'
  | 'stale'
  | 'available'
  | 'assigned'
  | 'on_trip'
  | 'unauthorized'
  | 'maintenance';

const statusToMarker: Record<string, string> = {
  available: 'bg-success border-green-700',
  assigned: 'bg-primary border-blue-700',
  on_trip: 'bg-primary border-blue-700',
  moving: 'bg-primary border-blue-700',
  stopped: 'bg-amber-400 border-amber-700',
  delayed: 'bg-amber-500 border-amber-800',
  offline: 'bg-slate-400 border-slate-600',
  poor_gps: 'bg-orange-400 border-orange-700',
  gps_excellent: 'bg-green-500 border-green-800',
  gps_acceptable: 'bg-blue-500 border-blue-800',
  gps_poor: 'bg-orange-400 border-orange-700',
  gps_very_poor: 'bg-red-500 border-red-800',
  stale: 'bg-slate-400 border-slate-600',
  unauthorized: 'bg-danger border-red-800',
  maintenance: 'bg-slate-500 border-slate-700',
};

const pinColors: Record<string, { background: string; border: string }> = {
  available: { background: '#16a34a', border: '#14532d' },
  assigned: { background: '#2563eb', border: '#1e3a8a' },
  on_trip: { background: '#2563eb', border: '#1e3a8a' },
  moving: { background: '#2563eb', border: '#1e3a8a' },
  stopped: { background: '#d97706', border: '#92400e' },
  delayed: { background: '#f59e0b', border: '#b45309' },
  offline: { background: '#94a3b8', border: '#475569' },
  poor_gps: { background: '#ea580c', border: '#9a3412' },
  gps_excellent: { background: '#16a34a', border: '#14532d' },
  gps_acceptable: { background: '#2563eb', border: '#1e3a8a' },
  gps_poor: { background: '#ea580c', border: '#9a3412' },
  gps_very_poor: { background: '#dc2626', border: '#7f1d1d' },
  stale: { background: '#94a3b8', border: '#475569' },
  unauthorized: { background: '#dc2626', border: '#7f1d1d' },
  maintenance: { background: '#64748b', border: '#334155' },
};

/** Converts lat/lng around Kigali into percentage positions for the CSS fallback map */
function toPos(lat: number, lng: number) {
  const minLat = -2.02;
  const maxLat = -1.9;
  const minLng = 30.02;
  const maxLng = 30.16;
  const top = ((maxLat - lat) / (maxLat - minLat)) * 100;
  const left = ((lng - minLng) / (maxLng - minLng)) * 100;
  return {
    top: `${Math.min(Math.max(top, 8), 92)}%`,
    left: `${Math.min(Math.max(left, 8), 92)}%`,
  };
}

function resolveMarkerStatus(m: Motorcycle): MapMarkerStatus {
  if (m.mapStatus) return m.mapStatus;
  return m.status;
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

interface OpsMapProps {
  motorcycles: Motorcycle[];
  selectedId?: string | null;
  onSelect?: (m: Motorcycle) => void;
  /** Alias for onSelect */
  onMarkerClick?: (m: Motorcycle) => void;
  className?: string;
  compact?: boolean;
  connecting?: boolean;
  /** Encoded Google polyline string (optional). Prefer routePath when available. */
  routePolyline?: string | null;
  /** Explicit route path points for Polyline overlay. */
  routePath?: LatLngPoint[] | null;
  /** When followMode + selected, pan map to selection on updates. */
  followMode?: boolean;
  /** Bump to force fit/center on selection or fleet. */
  centerToken?: number;
  hideSelectedCard?: boolean;
}

const KIGALI = { lat: -1.9441, lng: 30.0619 };
const ROUTE_STROKE = '#2563eb';

function CenterFleetButton({ motorcycles }: { motorcycles: Motorcycle[] }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
      onClick={() => {
        if (!map || motorcycles.length === 0) return;
        const bounds = new google.maps.LatLngBounds();
        motorcycles.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds, 64);
      }}
    >
      <Navigation className="size-3.5" />
      Center fleet
    </button>
  );
}

function MapCameraController({
  motorcycles,
  selectedId,
  followMode,
  centerToken,
  routePath,
}: {
  motorcycles: Motorcycle[];
  selectedId?: string | null;
  followMode?: boolean;
  centerToken?: number;
  routePath?: LatLngPoint[] | null;
}) {
  const map = useMap();
  const selected = motorcycles.find((m) => m.id === selectedId);

  useEffect(() => {
    if (!map || !selected || !followMode) return;
    map.panTo({ lat: selected.lat, lng: selected.lng });
  }, [map, selected?.lat, selected?.lng, followMode, selected]);

  useEffect(() => {
    if (!map || !centerToken) return;
    if (selected) {
      map.panTo({ lat: selected.lat, lng: selected.lng });
      map.setZoom(Math.max(map.getZoom() ?? 14, 15));
      return;
    }
    if (routePath && routePath.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      routePath.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 48);
      return;
    }
    if (motorcycles.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      motorcycles.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds, 64);
    }
  }, [centerToken, map, selected, motorcycles, routePath]);

  return null;
}

function RouteOverlay({
  routePath,
  routePolyline,
}: {
  routePath?: LatLngPoint[] | null;
  routePolyline?: string | null;
}) {
  const path = useMemo(() => {
    if (routePath && routePath.length > 1) return routePath;
    if (routePolyline && typeof google !== 'undefined' && google.maps?.geometry?.encoding) {
      try {
        return google.maps.geometry.encoding
          .decodePath(routePolyline)
          .map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
      } catch {
        return [];
      }
    }
    return [];
  }, [routePath, routePolyline]);

  if (path.length < 2) return null;

  return (
    <Polyline
      path={path}
      strokeColor={ROUTE_STROKE}
      strokeOpacity={0.85}
      strokeWeight={4}
      geodesic
    />
  );
}

function AccuracyCircleOverlay({ motorcycle }: { motorcycle: Motorcycle }) {
  const map = useMap();
  const radius = motorcycle.accuracyMeters;
  const status = resolveMarkerStatus(motorcycle);
  const colors = pinColors[status] ?? pinColors.offline;

  useEffect(() => {
    if (!map || radius == null || !Number.isFinite(radius) || radius <= 0) {
      return;
    }
    const circle = new google.maps.Circle({
      map,
      center: { lat: motorcycle.lat, lng: motorcycle.lng },
      radius,
      fillColor: colors.background,
      fillOpacity: 0.12,
      strokeColor: colors.background,
      strokeOpacity: 0.45,
      strokeWeight: 1,
      clickable: false,
    });
    return () => {
      circle.setMap(null);
    };
  }, [
    map,
    motorcycle.lat,
    motorcycle.lng,
    radius,
    colors.background,
  ]);

  return null;
}

function HeadingMarker({
  motorcycle,
  active,
  onClick,
}: {
  motorcycle: Motorcycle;
  active: boolean;
  onClick: () => void;
}) {
  const status = resolveMarkerStatus(motorcycle);
  const colors = pinColors[status] ?? pinColors.offline;
  const heading = motorcycle.heading;
  const showHeading =
    typeof heading === 'number' &&
    !Number.isNaN(heading) &&
    (status === 'moving' || status === 'on_trip' || (motorcycle.speed ?? 0) > 1);

  if (showHeading) {
    return (
      <AdvancedMarker
        position={{ lat: motorcycle.lat, lng: motorcycle.lng }}
        title={`${motorcycle.plate} · ${status}`}
        onClick={onClick}
        zIndex={active ? 10 : 1}
      >
        <div
          className={cn(
            'relative flex items-center justify-center transition-transform',
            active && 'scale-125',
          )}
          style={{ transform: `rotate(${heading}deg)` }}
        >
          <div
            className="size-0 border-l-[7px] border-r-[7px] border-b-[16px] border-l-transparent border-r-transparent drop-shadow-sm"
            style={{ borderBottomColor: colors.background }}
          />
        </div>
      </AdvancedMarker>
    );
  }

  return (
    <AdvancedMarker
      position={{ lat: motorcycle.lat, lng: motorcycle.lng }}
      title={`${motorcycle.plate} · ${status}`}
      onClick={onClick}
      zIndex={active ? 10 : 1}
    >
      <Pin
        background={colors.background}
        borderColor={colors.border}
        glyphColor="#ffffff"
        scale={active ? 1.3 : 1}
      />
    </AdvancedMarker>
  );
}

function GoogleOpsMap({
  motorcycles,
  selectedId,
  onSelect,
  onMarkerClick,
  className,
  compact,
  connecting,
  routePolyline,
  routePath,
  followMode,
  centerToken,
  hideSelectedCard,
}: OpsMapProps) {
  const handleClick = onMarkerClick ?? onSelect;
  const selected = motorcycles.find((m) => m.id === selectedId);
  const center = useMemo(() => {
    if (selected) return { lat: selected.lat, lng: selected.lng };
    if (motorcycles[0]) return { lat: motorcycles[0].lat, lng: motorcycles[0].lng };
    return KIGALI;
  }, [motorcycles, selected]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[12px] border border-border',
        compact ? 'min-h-[220px] h-full' : 'min-h-[320px] sm:min-h-[420px] h-full',
        className,
      )}
    >
      <APIProvider
        apiKey={appConfig.googleMapsBrowserKey}
        libraries={['geometry']}
      >
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId={appConfig.googleMapsMapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="absolute inset-0 size-full"
        >
          <RouteOverlay routePath={routePath} routePolyline={routePolyline} />

          {motorcycles.map((m) => (
            <Fragment key={m.id}>
              <AccuracyCircleOverlay motorcycle={m} />
              <HeadingMarker
                motorcycle={m}
                active={m.id === selectedId}
                onClick={() => handleClick?.(m)}
              />
            </Fragment>
          ))}

          <MapCameraController
            motorcycles={motorcycles}
            selectedId={selectedId}
            followMode={followMode}
            centerToken={centerToken}
            routePath={routePath}
          />

          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
            <CenterFleetButton motorcycles={motorcycles} />
            <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary">
              <Zap className="size-3.5" />
              Google Maps
            </span>
          </div>
        </Map>
      </APIProvider>

      {connecting ? (
        <div className="absolute inset-x-0 top-3 z-20 flex justify-center pointer-events-none">
          <span className="rounded-full bg-surface/95 border border-border px-3 py-1 text-xs text-text-secondary">
            Connecting to live fleet...
          </span>
        </div>
      ) : null}

      {!hideSelectedCard && selected ? (
        <SelectedCard selected={selected} onSelect={handleClick} />
      ) : null}
    </div>
  );
}

function CssOpsMap({
  motorcycles,
  selectedId,
  onSelect,
  onMarkerClick,
  className,
  compact,
  connecting,
  routePath,
  hideSelectedCard,
}: OpsMapProps) {
  const handleClick = onMarkerClick ?? onSelect;
  const selected = motorcycles.find((m) => m.id === selectedId);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[12px] border border-border ops-map-bg',
        compact ? 'min-h-[220px] h-full' : 'min-h-[320px] sm:min-h-[420px] h-full',
        className,
      )}
    >
      <span className="absolute top-[18%] left-[22%] text-[10px] font-medium text-slate-400/80">
        Gisozi
      </span>
      <span className="absolute top-[28%] left-[48%] text-[10px] font-medium text-slate-400/80">
        Kacyiru
      </span>
      <span className="absolute top-[38%] left-[72%] text-[10px] font-medium text-slate-400/80">
        Remera
      </span>
      <span className="absolute top-[55%] left-[78%] text-[10px] font-medium text-slate-400/80">
        Kimironko
      </span>
      <span className="absolute top-[68%] left-[55%] text-[10px] font-medium text-slate-400/80">
        Kicukiro
      </span>
      <span className="absolute top-[72%] left-[28%] text-[10px] font-medium text-slate-400/80">
        Nyamirambo
      </span>

      {routePath && routePath.length > 1 ? (
        <svg className="absolute inset-0 size-full pointer-events-none opacity-70">
          <polyline
            fill="none"
            stroke={ROUTE_STROKE}
            strokeWidth="2"
            points={routePath
              .map((p) => {
                const pos = toPos(p.lat, p.lng);
                return `${parseFloat(pos.left)},${parseFloat(pos.top)}`;
              })
              .join(' ')}
          />
        </svg>
      ) : (
        <svg className="absolute inset-0 size-full pointer-events-none opacity-40">
          <path
            d="M 35% 45% Q 50% 35% 70% 40%"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        </svg>
      )}

      {motorcycles.map((m) => {
        const pos = toPos(m.lat, m.lng);
        const active = m.id === selectedId;
        const status = resolveMarkerStatus(m);
        return (
          <button
            key={m.id}
            type="button"
            style={{ top: pos.top, left: pos.left }}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 size-3.5 rounded-full border-2 shadow-sm transition-transform',
              statusToMarker[status] ?? statusToMarker.offline,
              active && 'scale-150 ring-4 ring-primary/25 z-10',
            )}
            onClick={() => handleClick?.(m)}
            title={`${m.plate} · ${status}`}
          />
        );
      })}

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
        >
          <Navigation className="size-3.5" />
          Center fleet
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-800">
          Paste NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Map
        </span>
      </div>

      {connecting ? (
        <div className="absolute inset-x-0 top-3 flex justify-center">
          <span className="rounded-full bg-surface/95 border border-border px-3 py-1 text-xs text-text-secondary">
            Connecting to live fleet...
          </span>
        </div>
      ) : null}

      {!hideSelectedCard && selected ? (
        <SelectedCard selected={selected} onSelect={handleClick} />
      ) : null}
    </div>
  );
}

function SelectedCard({
  selected,
  onSelect,
}: {
  selected: Motorcycle;
  onSelect?: (m: Motorcycle) => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-72 z-20 rounded-[10px] border border-border bg-surface p-3 shadow-[var(--shadow-overlay)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-text">{selected.plate}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {selected.riderName ?? 'Unassigned'}
          </p>
        </div>
        <StatusBadge
          status={
            selected.mapStatus === 'moving' || selected.mapStatus === 'gps_acceptable'
              ? 'on_trip'
              : selected.mapStatus === 'gps_excellent'
                ? 'available'
                : selected.mapStatus === 'stopped'
                  ? 'waiting'
                  : selected.mapStatus === 'poor_gps' ||
                      selected.mapStatus === 'gps_poor' ||
                      selected.mapStatus === 'gps_very_poor'
                    ? 'warning'
                    : selected.mapStatus === 'delayed' || selected.mapStatus === 'stale'
                      ? 'delayed'
                      : selected.mapStatus === 'offline'
                        ? 'offline'
                        : selected.status === 'unauthorized'
                          ? 'unauthorized'
                          : selected.status
          }
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-text-secondary">
          <MapPin className="size-3.5" />
          {selected.location}
        </div>
        <div className="text-text-secondary">
          {selected.speed > 0 ? `${selected.speed} km/h` : 'Stopped'}
        </div>
        {selected.accuracyMeters != null ? (
          <div className="text-text-muted col-span-2">
            Accuracy ±{Math.round(selected.accuracyMeters)} m
          </div>
        ) : null}
        <div className="text-text-muted col-span-2">{selected.lastSeen}</div>
      </div>
      <button
        type="button"
        className="mt-3 w-full rounded-[8px] border border-border py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
        onClick={() => onSelect?.(selected)}
      >
        View details
      </button>
    </div>
  );
}

/**
 * Ops map: Google Maps JS when browser key is set; CSS Kigali placeholder otherwise.
 * Paste key in frontend/.env.local — see backend/docs/GOOGLE_MAPS_SETUP.md
 */
export function OpsMap(props: OpsMapProps) {
  if (isGoogleMapsEnabled()) {
    return <GoogleOpsMap {...props} />;
  }
  return <CssOpsMap {...props} />;
}

export function FleetLegend({ className }: { className?: string }) {
  const items = [
    { status: 'gps_excellent', label: '≤25 m', color: 'bg-green-500' },
    { status: 'gps_acceptable', label: '26–80 m', color: 'bg-blue-500' },
    { status: 'gps_poor', label: '81–200 m', color: 'bg-orange-500' },
    { status: 'gps_very_poor', label: '201–500 m', color: 'bg-red-500' },
    { status: 'stale', label: 'Stale >30 s', color: 'bg-slate-400' },
  ] as const;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {items.map((item) => (
        <span
          key={item.status}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
        >
          <span
            className={cn('inline-block size-2 rounded-full shrink-0', item.color)}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ClassicFleetLegend({ className }: { className?: string }) {
  const items = [
    { status: 'available', label: 'Available' },
    { status: 'on_trip', label: 'On trip' },
    { status: 'pending', label: 'Waiting' },
    { status: 'offline', label: 'Offline' },
    { status: 'unauthorized', label: 'Incident' },
  ] as const;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {items.map((item) => (
        <span
          key={item.status}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
        >
          <StatusDot status={item.status} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
