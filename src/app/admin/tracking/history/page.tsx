"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  fetchSessionRoute,
  fetchTrackingSessions,
  type DriverStopDto,
  type SessionRoutePointDto,
  type TrackingSessionDto,
} from "@/lib/api/tracking";
import { fetchRiders, type RiderDto } from "@/lib/api/resources";
import { formatKm, formatRelativeTime } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle } from "@/types";
import { History, MapPinned, Timer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function riderLabel(r: RiderDto) {
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ").trim();
  return name || r.phone || r.id.slice(0, 8);
}

function toDayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function TrackingHistoryPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [riders, setRiders] = useState<RiderDto[]>([]);
  const [riderId, setRiderId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<TrackingSessionDto[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [route, setRoute] = useState<SessionRoutePointDto[]>([]);
  const [stops, setStops] = useState<DriverStopDto[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrackingSessionDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void fetchRiders(companyId, { limit: 100 })
      .then((res) => setRiders(res.items))
      .catch(() => setRiders([]));
  }, [companyId]);

  const loadSessions = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const bounds = toDayBounds(date);
      const items = await fetchTrackingSessions(companyId, {
        riderId: riderId || undefined,
        from: bounds.from,
        to: bounds.to,
      });
      setSessions(items);
      setSessionId(items[0]?.id ?? "");
      setSelectedSession(items[0] ?? null);
      if (!items[0]) {
        setRoute([]);
        setStops([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
      setSessions([]);
      setSessionId("");
      setSelectedSession(null);
      setRoute([]);
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, date, riderId]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!companyId || !sessionId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchSessionRoute(companyId, sessionId);
        if (cancelled) return;
        setRoute(data.route ?? []);
        setStops(data.stops ?? []);
        setSelectedSession(sessions.find((s) => s.id === sessionId) ?? null);
      } catch {
        if (!cancelled) {
          setRoute([]);
          setStops([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, sessionId, sessions]);

  const routePath = useMemo(
    () => route.map((p) => ({ lat: p.latitude, lng: p.longitude })),
    [route],
  );

  const mapMarkers: Motorcycle[] = useMemo(() => {
    if (routePath.length === 0) return [];
    const start = routePath[0];
    const end = routePath[routePath.length - 1];
    const markers: Motorcycle[] = [
      {
        id: "start",
        plate: "Start",
        fleetNumber: "S",
        brand: "",
        model: "",
        year: 0,
        color: "",
        status: "available",
        gpsStatus: "online",
        mapStatus: "stopped",
        location: "Session start",
        lat: start.lat,
        lng: start.lng,
        speed: 0,
        tripsToday: 0,
        distanceTodayKm: 0,
        lastSeen: selectedSession?.startedAt
          ? formatRelativeTime(selectedSession.startedAt)
          : "",
      },
    ];
    if (routePath.length > 1) {
      markers.push({
        id: "end",
        plate: "End",
        fleetNumber: "E",
        brand: "",
        model: "",
        year: 0,
        color: "",
        status: "on_trip",
        gpsStatus: "online",
        mapStatus: "moving",
        location: "Session end",
        lat: end.lat,
        lng: end.lng,
        speed: 0,
        tripsToday: 0,
        distanceTodayKm: 0,
        lastSeen: selectedSession?.endedAt
          ? formatRelativeTime(selectedSession.endedAt)
          : "Active",
      });
    }
    return markers;
  }, [routePath, selectedSession]);

  const timeline = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      meta: string;
      at: string;
    }> = [];
    if (selectedSession?.startedAt) {
      items.push({
        id: "start",
        label: "Session started",
        meta: selectedSession.startAddress ?? "Tracking began",
        at: selectedSession.startedAt,
      });
    }
    for (const stop of stops) {
      items.push({
        id: stop.id,
        label: "Stop",
        meta:
          stop.address ??
          (stop.durationSeconds != null
            ? `${Math.round(stop.durationSeconds / 60)} min`
            : `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`),
        at: stop.startedAt,
      });
    }
    if (selectedSession?.endedAt) {
      items.push({
        id: "end",
        label: "Session ended",
        meta: selectedSession.endAddress ?? "Tracking ended",
        at: selectedSession.endedAt,
      });
    }
    return items.sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
  }, [selectedSession, stops]);

  const durationMin = selectedSession
    ? Math.max(
        0,
        Math.round(
          ((selectedSession.endedAt
            ? new Date(selectedSession.endedAt).getTime()
            : Date.now()) -
            new Date(selectedSession.startedAt).getTime()) /
            60000,
        ),
      )
    : 0;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Tracking History"
        description="Replay rider sessions, routes, and stops."
      />

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Rider">
            <Select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
            >
              <option value="">All riders</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {riderLabel(r)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Session">
            <Select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={sessions.length === 0}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.startedAt).toLocaleTimeString()} ·{" "}
                    {formatKm(s.totalDistanceMeters / 1000)} · {s.status}
                  </option>
                ))
              )}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => void loadSessions()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-danger">{error}</p>
        ) : null}
      </Card>

      {!selectedSession ? (
        <Card>
          <EmptyState
            icon={<History className="size-6" />}
            title="No sessions found"
            description="Pick a rider and date with tracking activity to replay the route."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Distance"
              value={formatKm(selectedSession.totalDistanceMeters / 1000)}
              accent="primary"
              icon={<MapPinned className="size-4" />}
            />
            <MetricCard
              label="Duration"
              value={`${durationMin} min`}
              accent="none"
              icon={<Timer className="size-4" />}
            />
            <MetricCard
              label="Stops"
              value={stops.length}
              accent="warning"
            />
            <MetricCard
              label="Status"
              value={selectedSession.status}
              accent="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3 p-0 overflow-hidden" padding="none">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-text">Route map</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {route.length} point{route.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="p-3 sm:p-4">
                <OpsMap
                  motorcycles={mapMarkers}
                  selectedId="end"
                  routePath={routePath}
                  hideSelectedCard
                  className="h-[320px] sm:h-[480px]"
                />
              </div>
            </Card>

            <Card className="lg:col-span-2 p-0 overflow-hidden" padding="none">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-text">Timeline</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Starts, stops, and end
                  </p>
                </div>
                <StatusBadge status={selectedSession.status === "ACTIVE" ? "on_trip" : "completed"} />
              </div>
              <ul className="divide-y divide-border overflow-y-auto panel-scroll max-h-[480px]">
                {timeline.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-text">{item.label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {item.meta}
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {new Date(item.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
