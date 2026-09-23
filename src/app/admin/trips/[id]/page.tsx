"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, Timeline } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchLiveFleet, fleetLiveToMotorcycle } from "@/lib/api/locations";
import { mapTrip } from "@/lib/api/mappers";
import {
  assignTrip,
  cancelTrip,
  fetchAssignmentCandidates,
  fetchTrip,
  redispatchTrip,
  type AssignmentCandidateDto,
  type AssignmentRecommendationsDto,
} from "@/lib/api/resources";
import { calculateFare, formatKm, formatRwf, initials } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle, Trip } from "@/types";
import { ArrowLeft, Clock, MapPin, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [rawStatus, setRawStatus] = useState<string>("");
  const [bike, setBike] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [recommendations, setRecommendations] =
    useState<AssignmentRecommendationsDto | null>(null);
  const [assigningRiderId, setAssigningRiderId] = useState<string | null>(null);
  const [redispatching, setRedispatching] = useState(false);

  const load = useCallback(async () => {
    if (!companyId || !params.id) return;
    setLoading(true);
    setError(null);
    try {
      const dto = await fetchTrip(companyId, params.id);
      setTrip(mapTrip(dto));
      setRawStatus(dto.status);
      if (dto.motorcycleId) {
        try {
          const fleet = await fetchLiveFleet(companyId);
          const live = fleet.find((f) => f.motorcycleId === dto.motorcycleId);
          if (live) setBike(fleetLiveToMotorcycle(live));
        } catch {
          setBike(null);
        }
      } else {
        setBike(null);
      }

      const status = dto.status.toUpperCase();
      const needsAssign =
        status.includes("SEARCH") ||
        status === "RIDER_ASSIGNED" ||
        status === "NO_RIDER_AVAILABLE";
      if (needsAssign && !dto.acceptedAt) {
        try {
          const recs = await fetchAssignmentCandidates(companyId, params.id);
          setRecommendations(recs);
        } catch {
          setRecommendations(null);
        }
      } else {
        setRecommendations(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trip");
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const fare = useMemo(
    () => (trip ? calculateFare(trip.distanceKm) : null),
    [trip],
  );

  async function onAssign(candidate: AssignmentCandidateDto) {
    if (!companyId || !trip) return;
    setAssigningRiderId(candidate.riderId);
    setError(null);
    try {
      await assignTrip(companyId, trip.id, {
        riderId: candidate.riderId,
        motorcycleId: candidate.motorcycleId,
        reason: candidate.recommended ? "Nearest recommended rider" : "Admin manual assign",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setAssigningRiderId(null);
    }
  }

  async function onRedispatch() {
    if (!companyId || !trip) return;
    setRedispatching(true);
    setError(null);
    try {
      await redispatchTrip(companyId, trip.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-dispatch failed");
    } finally {
      setRedispatching(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 text-center text-sm text-text-muted">
        Loading trip…
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 text-center space-y-3">
        <h1 className="text-xl font-semibold text-text">Trip not found</h1>
        <p className="text-sm text-text-secondary">
          {error ?? `No trip matches ${params.id}.`}
        </p>
        <Link
          href="/admin/trips"
          className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
        >
          Back to trips
        </Link>
      </div>
    );
  }

  const isLive =
    trip.status === "in_progress" ||
    trip.status === "to_pickup" ||
    trip.status === "waiting" ||
    trip.status === "assigned" ||
    trip.status === "searching";
  const isCompleted = trip.status === "completed";
  const showRecommendations =
    Boolean(recommendations) &&
    (rawStatus.toUpperCase().includes("SEARCH") ||
      rawStatus.toUpperCase() === "RIDER_ASSIGNED" ||
      rawStatus.toUpperCase() === "NO_RIDER_AVAILABLE");
  const canRedispatch =
    rawStatus.toUpperCase() === "NO_RIDER_AVAILABLE" ||
    rawStatus.toUpperCase().includes("SEARCH");

  const timeline = [
    {
      label: "Request received",
      time: trip.requestedAt,
      done: !!trip.requestedAt || !!trip.assignedAt || isCompleted,
    },
    {
      label: "Rider assigned",
      time: trip.assignedAt,
      done: !!trip.assignedAt || !!trip.pickupAt || isCompleted || trip.status === "in_progress",
      current: trip.status === "assigned",
    },
    {
      label: "En route to pickup",
      time: trip.status === "to_pickup" ? "In progress" : undefined,
      done:
        trip.status === "waiting" ||
        trip.status === "in_progress" ||
        isCompleted ||
        !!trip.pickupAt,
      current: trip.status === "to_pickup",
    },
    {
      label: "Passenger picked up",
      time: trip.pickupAt ?? trip.startedAt,
      done: trip.status === "in_progress" || isCompleted,
      current: trip.status === "waiting",
    },
    {
      label: "Trip in progress",
      time: trip.startedAt,
      done: isCompleted,
      current: trip.status === "in_progress",
    },
    {
      label: "Completed",
      time: trip.completedAt,
      done: isCompleted,
      current: false,
    },
  ];

  if (trip.status === "cancelled") {
    timeline.push({
      label: "Cancelled",
      time: undefined,
      done: true,
      current: true,
    });
  }

  async function onCancel() {
    if (!companyId || !trip) return;
    setCancelling(true);
    try {
      await cancelTrip(companyId, trip.id, "Cancelled by admin");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title={trip.id.slice(0, 8)}
        description={`${trip.pickup} → ${trip.destination}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={trip.status} />
            <Link
              href="/admin/trips"
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-muted"
            >
              <ArrowLeft className="size-3.5" />
              All trips
            </Link>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      {showRecommendations ? (
        <Card>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                Recommended riders
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Auto-dispatch picks the nearest AVAILABLE rider with fresh GPS. You can also
                assign manually below. Assigning notifies the WhatsApp customer with plate,
                phone, and ETA.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">
                {recommendations?.method}
              </span>
              {canRedispatch ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={redispatching}
                  onClick={() => void onRedispatch()}
                >
                  {redispatching ? "Searching…" : "Auto-assign nearest"}
                </Button>
              ) : null}
            </div>
          </div>
          {!recommendations?.candidates.length ? (
            <p className="text-sm text-text-secondary py-2">
              No available riders with recent GPS near this pickup. Set riders to Available on
              the Riders page (with a motorcycle assigned), then try Auto-assign again.
            </p>
          ) : null}
          <ul className="divide-y divide-border">
            {recommendations?.candidates.map((c) => (
              <li
                key={c.riderId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    #{c.rank} {c.riderName}
                    {c.recommended ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Nearest
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {c.plateNumber || "No plate"} · {c.riderPhone || "No phone"} ·{" "}
                    {c.etaMinutes != null ? `~${c.etaMinutes} min` : "ETA n/a"} ·{" "}
                    {(c.distanceMeters / 1000).toFixed(1)} km
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={assigningRiderId != null}
                  onClick={() => void onAssign(c)}
                >
                  {assigningRiderId === c.riderId ? "Assigning…" : "Assign"}
                </Button>
              </li>
            ))}
          </ul>
          {recommendations && recommendations.candidates.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No available riders with fresh GPS near this pickup.
            </p>
          ) : null}
        </Card>
      ) : null}

      {(isLive || trip.etaMin != null) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {trip.etaMin != null ? (
            <MetricCard
              label="ETA"
              value={`${trip.etaMin} min`}
              accent="primary"
              icon={<Clock className="size-4" />}
            />
          ) : null}
          <MetricCard
            label="Distance"
            value={formatKm(trip.distanceKm)}
            icon={<MapPin className="size-4" />}
          />
          <MetricCard label="Fare" value={formatRwf(trip.cost)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text">Trip map</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {bike?.plate ?? trip.motorcyclePlate} · {trip.riderName}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={bike ? [bike] : []}
              selectedId={bike?.id}
              className="h-[280px] sm:h-[420px]"
              compact
            />
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Trip details</h2>
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={initials(trip.employeeName)} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{trip.employeeName}</p>
                <p className="text-xs text-text-secondary">
                  {trip.employeePhone ?? "No phone on file"}
                </p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Rider" value={trip.riderName} />
              <DetailRow label="Motorcycle" value={trip.motorcyclePlate} />
              <DetailRow label="Pickup" value={trip.pickup} />
              <DetailRow label="Destination" value={trip.destination} />
              {trip.durationMin != null ? (
                <DetailRow label="Duration" value={`${trip.durationMin} min`} />
              ) : null}
              {trip.requestId ? (
                <DetailRow label="Request" value={trip.requestId.slice(0, 8)} />
              ) : null}
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Timeline</h2>
            <Timeline steps={timeline} />
          </Card>

          {isCompleted && fare ? (
            <Card>
              <h2 className="text-sm font-semibold text-text mb-3">Fare breakdown</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>First km</span>
                  <span>{formatRwf(fare.firstKm > 0 ? 500 : 0)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Remaining ({formatKm(fare.remainingKm)} × 400)</span>
                  <span>{formatRwf(fare.remainingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-text">
                  <span>Total</span>
                  <span>{formatRwf(fare.total || trip.cost)}</span>
                </div>
              </div>
            </Card>
          ) : null}

          {isLive ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger-outline"
                size="sm"
                disabled={cancelling}
                onClick={() => void onCancel()}
              >
                {cancelling ? "Cancelling…" : "Cancel trip"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium text-text text-right">{value}</dd>
    </div>
  );
}
