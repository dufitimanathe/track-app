"use client";

import { Button } from "@/components/ui/button";
import { RiderAvailabilityCard } from "@/components/rider/availability-card";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapAvailability, mapRiderMeMotorcycle, mapTrip } from "@/lib/api/mappers";
import {
  fetchRiderMe,
  fetchTrips,
  type RiderMeDto,
} from "@/lib/api/resources";
import { formatKm, formatRwf, greetingForHour } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle, Trip } from "@/types";
import { Bike, MapPin, Navigation, Route } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function RiderHomePage() {
  const { userName, companyId } = useAppSelector((s) => s.auth);
  const [me, setMe] = useState<RiderMeDto | null>(null);
  const [moto, setMoto] = useState<Motorcycle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rawTrips, setRawTrips] = useState<
    Array<{ id: string; status: string; pickupAddress: string; destinationAddress: string; employeeName?: string | null; estimatedDistanceKm?: string | null; estimatedPrice?: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loadVersion = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (!companyId) return;
    const version = ++loadVersion.current;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const [rider, tripResult] = await Promise.all([
        fetchRiderMe(companyId),
        fetchTrips(companyId, { limit: 30, sort: "createdAt:DESC" }),
      ]);
      if (version !== loadVersion.current) return;
      setMe(rider);
      setMoto(mapRiderMeMotorcycle(rider));
      setRawTrips(tripResult.items);
      setTrips(tripResult.items.map(mapTrip));
    } catch (err) {
      if (!silent && version === loadVersion.current) setError(err instanceof Error ? err.message : "Failed to load rider home");
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (busy) return;
    const refresh = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [busy, load]);

  const online = me
    ? !["OFFLINE", "SUSPENDED"].includes(me.availabilityStatus.toUpperCase())
    : false;

  const activeTrip = useMemo(
    () =>
      trips.find((t) =>
        ["in_progress", "to_pickup", "waiting", "assigned"].includes(t.status),
      ) ?? null,
    [trips],
  );

  const completedToday = useMemo(() => {
    return trips.filter((t) => t.status === "completed").length;
  }, [trips]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-sm text-text-secondary">
          {greetingForHour()}, {userName.split(" ")[0]}
        </p>
        <h1 className="text-xl font-semibold text-text tracking-tight mt-0.5">
          Rider home
        </h1>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-[10px] bg-primary-soft p-2.5 text-primary">
              <Bike className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                {moto?.plate ?? "No motorcycle assigned"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {moto
                  ? `${moto.fleetNumber} · ${moto.brand} ${moto.model}`
                  : "Assign a unit before going online"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={online ? "online" : "offline"} />
          {me ? (
            <StatusBadge status={mapAvailability(me.availabilityStatus)} />
          ) : null}
          {moto ? (
            <StatusBadge
              status={moto.gpsStatus === "online" ? "online" : "gps_offline"}
              label={moto.gpsStatus === "online" ? "GPS Connected" : "GPS Offline"}
            />
          ) : null}
        </div>
      </Card>

      {!activeTrip && me && <RiderAvailabilityCard
        companyId={companyId} riderId={me.id} status={me.availabilityStatus}
        hasMotorcycle={Boolean(moto)} onUpdated={(updated) => {
          ++loadVersion.current;
          setMe((current) => current ? { ...current, ...updated } : current);
        }}
      />}

      {activeTrip ? (
        <Card padding="md" className="border-l-[3px] border-l-primary">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Current trip
              </p>
              <p className="text-sm font-semibold text-text mt-1">
                {activeTrip.id.slice(0, 8)}
              </p>
            </div>
            <StatusBadge status={activeTrip.status} />
          </div>
          <p className="mt-2 text-sm text-text-secondary">{activeTrip.employeeName}</p>
          <p className="mt-1 text-sm text-text">
            {activeTrip.pickup} → {activeTrip.destination}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
            {activeTrip.etaMin != null ? <span>ETA {activeTrip.etaMin} min</span> : null}
            <span>{formatKm(activeTrip.distanceKm)}</span>
          </div>
          <Link href="/rider/active" className="mt-4 block">
            <Button fullWidth leftIcon={<Navigation className="size-4" />}>
              Open active trip
            </Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Active" value={activeTrip ? 1 : 0} className="!p-3" />
        <MetricCard
          label="Completed"
          value={completedToday}
          accent="success"
          className="!p-3"
        />
        <MetricCard
          label="Distance"
          value={formatKm(moto?.distanceTodayKm ?? 0)}
          icon={<Route className="size-3.5" />}
          className="!p-3"
        />
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="size-4 text-text-muted" />
          Current area: {moto?.location ?? "No fix"}
        </div>
        <Link href="/rider/map" className="mt-3 inline-block text-xs font-medium text-primary">
          Open map
        </Link>
      </Card>

    </div>
  );
}
