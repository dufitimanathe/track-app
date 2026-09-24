'use client';

import { FleetLegend, OpsMap } from '@/components/maps/ops-map';
import { Button } from '@/components/ui/button';
import { Card, MetricCard } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/input';
import {
  LiveIndicator,
  PageHeader,
  Tabs,
} from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  useLiveTracking,
  type LiveMarkerStatus,
  type LiveRiderState,
  type TrackingConnectionState,
} from '@/hooks/use-live-tracking';
import { cn, formatKm, formatRelativeTime } from '@/lib/utils';
import type { Motorcycle } from '@/types';
import {
  CircleOff,
  Crosshair,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Timer,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type RiderFilter = 'all' | 'moving' | 'stopped' | 'offline' | 'delayed';

const filterTabs: { id: RiderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'moving', label: 'Moving' },
  { id: 'stopped', label: 'Stopped' },
  { id: 'offline', label: 'Offline' },
  { id: 'delayed', label: 'Delayed' },
];

function matchesFilter(r: LiveRiderState, filter: RiderFilter) {
  if (filter === 'all') return true;
  return r.markerStatus === filter;
}

function speedKmh(speedMps: number | null | undefined) {
  return (speedMps ?? 0) * 3.6;
}

function markerToFleetStatus(status: LiveMarkerStatus): Motorcycle['status'] {
  if (status === 'offline') return 'offline';
  if (status === 'moving') return 'on_trip';
  if (status === 'stopped') return 'assigned';
  return 'available';
}

function riderToMotorcycle(r: LiveRiderState): Motorcycle {
  const kmh = speedKmh(r.speed);
  const qualityMap = {
    excellent: 'gps_excellent',
    acceptable: 'gps_acceptable',
    poor: 'gps_poor',
    'very-poor': 'gps_very_poor',
    stale: 'stale',
    unknown: r.markerStatus,
  } as const;
  return {
    id: r.riderId,
    plate: r.plateNumber ?? '—',
    fleetNumber: r.plateNumber ?? '—',
    brand: '',
    model: '',
    year: 0,
    color: '',
    status: markerToFleetStatus(r.markerStatus),
    gpsStatus:
      r.markerStatus === 'offline'
        ? 'offline'
        : r.markerStatus === 'delayed' || r.markerStatus === 'stale'
          ? 'delayed'
          : 'online',
    mapStatus: qualityMap[r.gpsQuality] ?? r.markerStatus,
    accuracyMeters: r.accuracy,
    riderId: r.riderId,
    riderName: r.riderName ?? undefined,
    location: r.placeName?.trim()
      ? r.placeName
      : `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`,
    lat: r.latitude,
    lng: r.longitude,
    speed: Math.round(kmh * 10) / 10,
    tripsToday: 0,
    distanceTodayKm: r.distanceTodayMeters / 1000,
    lastSeen: formatRelativeTime(r.capturedAt),
    heading: r.heading ?? undefined,
  };
}

function statusBadgeTone(status: LiveMarkerStatus) {
  if (status === 'moving') return 'on_trip' as const;
  if (status === 'stopped') return 'waiting' as const;
  if (status === 'delayed' || status === 'stale') return 'delayed' as const;
  if (status === 'poor_gps') return 'warning' as const;
  return 'offline' as const;
}

function statusLabel(status: LiveMarkerStatus) {
  if (status === 'poor_gps') return 'Poor GPS';
  if (status === 'stale') return 'Stale';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function ConnectionBanner({
  state,
  error,
}: {
  state: TrackingConnectionState;
  error: string | null;
}) {
  if (state === 'connected' && !error) return null;

  const reconnecting = state === 'reconnecting';
  return (
    <div
      className={cn(
        'rounded-[10px] border px-4 py-2.5 text-sm flex items-center gap-2',
        reconnecting
          ? 'border-amber-200 bg-warning-soft text-amber-900'
          : 'border-red-200 bg-danger-soft text-red-900',
      )}
    >
      {reconnecting ? (
        <Wifi className="size-4 shrink-0" />
      ) : (
        <WifiOff className="size-4 shrink-0" />
      )}
      <span>
        {reconnecting
          ? 'Reconnecting to live tracking…'
          : error ?? 'Disconnected from live tracking'}
      </span>
    </div>
  );
}

export interface LiveTrackingViewProps {
  title?: string;
  description?: string;
  /** Base path for rider/fleet profile links (admin vs supervisor). */
  linksBase?: 'admin' | 'supervisor';
  companyId?: string;
}

export function LiveTrackingView({
  title = 'Live Operations',
  description,
  linksBase = 'admin',
  companyId,
}: LiveTrackingViewProps) {
  const {
    ridersList,
    selectedRiderId,
    selectedRider,
    selectRider,
    followMode,
    setFollowMode,
    routePath,
    activity,
    stats,
    connectionState,
    error,
    centerOnSelected,
    centerToken,
  } = useLiveTracking(companyId);

  const [filter, setFilter] = useState<RiderFilter>('all');
  const [query, setQuery] = useState('');
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  const mapUnits = useMemo(
    () => ridersList.map(riderToMotorcycle),
    [ridersList],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ridersList.filter((r) => {
      if (!matchesFilter(r, filter)) return false;
      if (!q) return true;
      return (
        (r.plateNumber?.toLowerCase().includes(q) ?? false) ||
        (r.riderName?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [filter, query, ridersList]);

  const filteredMapUnits = useMemo(
    () => filtered.map(riderToMotorcycle),
    [filtered],
  );

  const metricCards = [
    {
      label: 'Active',
      value: stats.active,
      accent: 'success' as const,
      icon: <Radio className="size-4" />,
    },
    {
      label: 'Moving',
      value: stats.moving,
      accent: 'primary' as const,
      icon: <Navigation className="size-4" />,
    },
    {
      label: 'Stopped',
      value: stats.stopped,
      accent: 'warning' as const,
      icon: <Timer className="size-4" />,
    },
    {
      label: 'Delayed',
      value: stats.delayed,
      accent: 'warning' as const,
      icon: <Timer className="size-4" />,
    },
    {
      label: 'Offline',
      value: stats.offline,
      accent: 'none' as const,
      icon: <CircleOff className="size-4" />,
    },
    {
      label: 'Distance today',
      value: formatKm(stats.distanceTodayKm),
      accent: 'primary' as const,
      icon: <MapPin className="size-4" />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1600px] mx-auto">
      <PageHeader
        title={title}
        description={
          description ??
          (connectionState === 'connected'
            ? 'Live rider tracking · phone GPS'
            : 'Connecting to tracking feed…')
        }
        actions={
          <LiveIndicator connected={connectionState === 'connected'} />
        }
      />

      <ConnectionBanner state={connectionState} error={error} />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {metricCards.map((s) => (
          <MetricCard
            key={s.label}
            label={s.label}
            value={s.value}
            accent={s.accent}
            icon={s.icon}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={filterTabs.map((t) => ({
            ...t,
            count:
              t.id === 'all'
                ? ridersList.length
                : ridersList.filter((r) => matchesFilter(r, t.id)).length,
          }))}
          active={filter}
          onChange={(id) => setFilter(id as RiderFilter)}
          className="flex-1"
        />
        <SearchInput
          placeholder="Search rider, plate, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-72 shrink-0"
        />
      </div>

      <div className="flex gap-1 rounded-[10px] border border-border bg-surface p-1 lg:hidden">
        {(['map', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setMobileView(v)}
            className={cn(
              'flex-1 rounded-[8px] py-2 text-sm font-medium capitalize transition-colors',
              mobileView === v
                ? 'bg-primary-soft text-primary'
                : 'text-text-secondary hover:text-text',
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card
          className={cn(
            'lg:col-span-3 p-0 overflow-hidden',
            mobileView === 'list' && 'hidden lg:block',
          )}
          padding="none"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-text">Fleet map</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {filtered.length} rider{filtered.length === 1 ? '' : 's'} shown
              </p>
            </div>
            <FleetLegend className="hidden sm:flex" />
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={filteredMapUnits}
              selectedId={selectedRiderId}
              onMarkerClick={(m) => void selectRider(m.id)}
              connecting={connectionState !== 'connected'}
              routePath={routePath}
              followMode={followMode}
              centerToken={centerToken}
              hideSelectedCard
              className="h-[320px] sm:h-[480px] lg:h-[560px]"
            />
            <FleetLegend className="mt-3 sm:hidden" />
          </div>
        </Card>

        <div
          className={cn(
            'lg:col-span-2 flex flex-col gap-4',
            mobileView === 'map' && 'hidden lg:flex',
          )}
        >
          <Card className="p-0 overflow-hidden flex flex-col" padding="none">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Riders</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Tap a rider for details
              </p>
            </div>
            <ul className="divide-y divide-border overflow-y-auto panel-scroll max-h-[280px] lg:max-h-[320px]">
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-text-muted">
                  No riders match this filter.
                </li>
              ) : (
                filtered.map((r) => (
                  <li key={r.riderId}>
                    <button
                      type="button"
                      onClick={() => void selectRider(r.riderId)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-surface-muted/70',
                        selectedRiderId === r.riderId && 'bg-primary-soft/50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate">
                            {r.riderName ?? 'Unknown rider'}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5 truncate">
                            {r.plateNumber ?? 'No plate'}
                            {r.phone ? ` · ${r.phone}` : ''}
                          </p>
                        </div>
                        <StatusBadge
                          status={statusBadgeTone(r.markerStatus)}
                          label={statusLabel(r.markerStatus)}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                        <span>
                          {speedKmh(r.speed) > 0.5
                            ? `${speedKmh(r.speed).toFixed(0)} km/h`
                            : 'Stopped'}
                        </span>
                        <span className="text-text-muted">
                          {formatRelativeTime(r.capturedAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col" padding="none">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Rider detail</h2>
            </div>
            {selectedRider ? (
              <div className="px-4 py-4 space-y-4">
                <div>
                  <p className="text-base font-semibold text-text">
                    {selectedRider.riderName ?? 'Unknown rider'}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                    <Phone className="size-3" />
                    {selectedRider.phone ?? 'No phone'}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Detail
                    label="Plate"
                    value={selectedRider.plateNumber ?? '—'}
                  />
                  <Detail
                    label="Speed"
                    value={
                      speedKmh(selectedRider.speed) > 0.5
                        ? `${speedKmh(selectedRider.speed).toFixed(1)} km/h`
                        : 'Stopped'
                    }
                  />
                  <Detail
                    label="Accuracy"
                    value={
                      selectedRider.accuracy != null
                        ? `${Math.round(selectedRider.accuracy)} m`
                        : '—'
                    }
                  />
                  <Detail
                    label="Heading"
                    value={
                      selectedRider.heading != null
                        ? `${Math.round(selectedRider.heading)}°`
                        : '—'
                    }
                  />
                  <Detail
                    label="Trip distance"
                    value={formatKm(selectedRider.totalDistanceMeters / 1000)}
                  />
                  <Detail
                    label="Today"
                    value={formatKm(selectedRider.distanceTodayMeters / 1000)}
                  />
                  <Detail
                    label="Place"
                    value={
                      selectedRider.placeName?.trim() ||
                      `${selectedRider.latitude.toFixed(5)}, ${selectedRider.longitude.toFixed(5)}`
                    }
                  />
                  <Detail label="Presence" value={selectedRider.presence} />
                  <Detail
                    label="Health"
                    value={selectedRider.sessionHealth ?? '—'}
                  />
                  <Detail
                    label="Last update"
                    value={formatRelativeTime(selectedRider.capturedAt)}
                  />
                </dl>

                <div className="flex flex-wrap gap-2">
                  {followMode && selectedRiderId === selectedRider.riderId ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setFollowMode(false)}
                    >
                      Stop Following
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      leftIcon={<Navigation className="size-3.5" />}
                      onClick={() => {
                        setFollowMode(true);
                        centerOnSelected();
                      }}
                    >
                      Follow Rider
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Crosshair className="size-3.5" />}
                    onClick={centerOnSelected}
                  >
                    Center
                  </Button>
                  {linksBase === 'admin' || linksBase === 'supervisor' ? (
                    <>
                      <Link href={`/${linksBase}/riders/${selectedRider.riderId}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<User className="size-3.5" />}
                        >
                          Rider
                        </Button>
                      </Link>
                      {selectedRider.motorcycleId ? (
                        <Link
                          href={`/${linksBase}/fleet/${selectedRider.motorcycleId}`}
                        >
                          <Button size="sm" variant="secondary">
                            Motorcycle
                          </Button>
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="px-4 py-8 text-sm text-text-muted text-center">
                Select a rider to see details.
              </p>
            )}
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col" padding="none">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Activity</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Sessions, geofences, presence — not every GPS tick
              </p>
            </div>
            <ul className="divide-y divide-border overflow-y-auto panel-scroll max-h-[200px]">
              {activity.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-text-muted">
                  No recent activity events.
                </li>
              ) : (
                activity.map((item) => (
                  <li key={item.id} className="px-4 py-2.5">
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    {item.subtitle ? (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.subtitle}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-text-muted mt-1">
                      {formatRelativeTime(item.at)}
                      {item.riderId && mapUnits.find((m) => m.id === item.riderId)
                        ? ` · ${
                            mapUnits.find((m) => m.id === item.riderId)?.riderName ??
                            ''
                          }`
                        : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-text truncate">{value}</dd>
    </div>
  );
}
