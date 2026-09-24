"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLiveFleet } from "@/hooks/use-live-fleet";
import { mapDashboard, mapTransportRequest, mapTrip } from "@/lib/api/mappers";
import {
  approveRequest,
  fetchDashboard,
  fetchTransportRequests,
  fetchTrips,
  rejectRequest,
} from "@/lib/api/resources";
import { formatKm, formatRwf, greetingForHour } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedMotorcycleId } from "@/store/slices/ui-slice";
import type { DashboardStats, TransportRequest, Trip } from "@/types";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  MapPinned,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const ACTIVE_TRIP_UI = new Set(["assigned", "to_pickup", "waiting", "in_progress", "searching", "no_rider"]);

export default function SupervisorDashboardPage() {
  const dispatch = useAppDispatch();
  const { userName, companyId } = useAppSelector((s) => s.auth);
  const selectedId = useAppSelector((s) => s.ui.selectedMotorcycleId);
  const { motorcycles, connecting } = useLiveFleet(companyId);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<TransportRequest[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; title: string; severity: string; detectedAt: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      const [dash, pendingRes, tripsRes] = await Promise.all([
        fetchDashboard(companyId),
        fetchTransportRequests(companyId, {
          page: 1,
          limit: 8,
          status: "PENDING_APPROVAL",
          sort: "requestedAt:DESC",
        }),
        fetchTrips(companyId, { page: 1, limit: 40, sort: "createdAt:DESC" }),
      ]);
      setStats(mapDashboard(dash));
      setAlerts(dash.recentAlerts ?? []);
      setPending(pendingRes.items.map(mapTransportRequest));
      setActiveTrips(
        tripsRes.items.map(mapTrip).filter((t) => ACTIVE_TRIP_UI.has(t.status)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: "approve" | "reject") {
    if (!companyId) return;
    setBusyId(id);
    try {
      if (action === "approve") await approveRequest(companyId, id);
      else await rejectRequest(companyId, id, "Rejected by supervisor");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const availableRiders = useMemo(
    () => stats?.availableRiders ?? 0,
    [stats],
  );

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-sm text-text-secondary">
          {greetingForHour()}, {userName.split(" ")[0] || "there"}
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight mt-0.5">
          Supervisor dispatch
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Approve requests, monitor active trips, and keep riders moving.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Pending Requests"
          value={stats?.pendingRequests ?? pending.length}
          hint="Needs your decision"
          accent="warning"
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          label="Active Trips"
          value={stats?.activeTrips ?? activeTrips.length}
          hint="Live now"
          accent="primary"
          icon={<MapPinned className="size-4" />}
        />
        <MetricCard
          label="Available Riders"
          value={availableRiders}
          hint="Ready to assign"
          accent="success"
          icon={<Users className="size-4" />}
        />
        <MetricCard
          label="Trips Today"
          value={stats?.tripsToday ?? "—"}
          hint={stats ? `${stats.completedToday} completed` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Pending requests</h2>
              <p className="text-xs text-text-muted mt-0.5">Approve or reject</p>
            </div>
            <Link href="/supervisor/requests" className="text-xs font-medium text-primary">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {pending.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                No pending requests
              </li>
            ) : (
              pending.map((req) => (
                <li key={req.id} className="px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text">{req.employeeName}</p>
                        <StatusBadge status="pending" />
                        {req.aiAssisted ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary-soft px-1.5 py-0.5 rounded">
                            AI
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {req.pickup} → {req.destination}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {req.createdAt} · {formatKm(req.estimatedDistanceKm)} ·{" "}
                        {formatRwf(req.estimatedCost)} · {req.channel}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        leftIcon={<Check className="size-3.5" />}
                        disabled={busyId === req.id}
                        onClick={() => void decide(req.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-outline"
                        leftIcon={<X className="size-3.5" />}
                        disabled={busyId === req.id}
                        onClick={() => void decide(req.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Active trips</h2>
              <p className="text-xs text-text-muted mt-0.5">In field now</p>
            </div>
            <Link href="/supervisor/active-trips" className="text-xs font-medium text-primary">
              Open
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {activeTrips.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                No active trips
              </li>
            ) : (
              activeTrips.slice(0, 8).map((trip) => (
                <li key={trip.id} className="px-4 py-3">
                  <Link href={`/supervisor/trips/${trip.id}`} className="block hover:opacity-90">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">{trip.id.slice(0, 8)}…</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {trip.riderName} · {trip.motorcyclePlate}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {trip.pickup} → {trip.destination}
                        </p>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>
                    {trip.etaMin != null ? (
                      <p className="text-[11px] text-text-muted mt-2">ETA {trip.etaMin} min</p>
                    ) : null}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Fleet snapshot</h2>
              <p className="text-xs text-text-muted mt-0.5">Live company fleet</p>
            </div>
            <Link href="/supervisor/fleet" className="text-xs font-medium text-primary">
              Full view
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={motorcycles}
              selectedId={selectedId}
              connecting={connecting}
              onSelect={(m) => dispatch(setSelectedMotorcycleId(m.id))}
              className="h-[240px] sm:h-[300px]"
              compact
            />
          </div>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Alerts</h2>
              <p className="text-xs text-text-muted mt-0.5">Needs awareness</p>
            </div>
            <Link href="/supervisor/notifications" className="text-xs font-medium text-primary">
              All
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {alerts.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                No recent alerts
              </li>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <li key={alert.id} className="px-4 py-3">
                  <div className="flex gap-3">
                    <div
                      className={
                        alert.severity.toUpperCase().includes("CRIT") ||
                        alert.severity.toUpperCase().includes("HIGH")
                          ? "mt-0.5 rounded-[8px] bg-danger-soft p-1.5 text-danger"
                          : alert.severity.toUpperCase().includes("WARN")
                            ? "mt-0.5 rounded-[8px] bg-warning-soft p-1.5 text-warning"
                            : "mt-0.5 rounded-[8px] bg-primary-soft p-1.5 text-primary"
                      }
                    >
                      <AlertTriangle className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{alert.title}</p>
                      <p className="text-[11px] text-text-muted mt-1">{alert.detectedAt}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
