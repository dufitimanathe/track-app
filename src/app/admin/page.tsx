"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLiveFleet } from "@/hooks/use-live-fleet";
import { fetchDashboard } from "@/lib/api/resources";
import { mapDashboard } from "@/lib/api/mappers";
import { formatLongDate, formatRwf, greetingForHour } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedMotorcycleId } from "@/store/slices/ui-slice";
import type { DashboardStats } from "@/types";
import {
  Bike,
  ClipboardList,
  MapPinned,
  Route,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminOverviewPage() {
  const dispatch = useAppDispatch();
  const { userName, companyId, companyType } = useAppSelector((s) => s.auth);
  const isClient = companyType === "CLIENT";
  const selectedId = useAppSelector((s) => s.ui.selectedMotorcycleId);
  const { motorcycles, connecting } = useLiveFleet(isClient ? undefined : companyId);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; title: string; severity: string; detectedAt: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void fetchDashboard(companyId)
      .then((dto) => {
        if (cancelled) return;
        setStats(mapDashboard(dto));
        setAlerts(dto.recentAlerts ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const s = stats;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-sm text-text-secondary">
          {greetingForHour()}, {userName.split(" ")[0] || "there"}
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight mt-0.5">
          Company operational overview
        </h1>
        <p className="text-sm text-text-muted mt-1">{formatLongDate()}</p>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Active Trips"
          value={s?.activeTrips ?? "—"}
          hint="Live now"
          accent="primary"
          icon={<MapPinned className="size-4" />}
        />
        {isClient ? (
          <MetricCard
            label="Employees"
            value={s?.employeesCount ?? "—"}
            hint="Active memberships"
            accent="success"
            icon={<Users className="size-4" />}
          />
        ) : (
          <MetricCard
            label="Available Riders"
            value={s ? `${s.availableRiders} / ${s.totalRiders}` : "—"}
            hint="Ready for assignment"
            accent="success"
            icon={<Users className="size-4" />}
          />
        )}
        <MetricCard
          label="Pending Approval"
          value={s?.pendingRequests ?? "—"}
          hint="Needs attention"
          accent="warning"
          icon={<ClipboardList className="size-4" />}
        />
        {isClient ? (
          <MetricCard
            label="Billing total"
            value={s ? formatRwf(s.billingTotal ?? 0) : "—"}
            hint="All billed trips"
            accent="success"
            icon={<Wallet className="size-4" />}
          />
        ) : (
          <MetricCard
            label="Fleet Online"
            value={s ? `${s.motorcyclesOnline} / ${s.totalMotorcycles}` : "—"}
            hint="GPS / phone tracking"
            accent="success"
            icon={<Bike className="size-4" />}
          />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Trips Today" value={s?.tripsToday ?? "—"} />
        <MetricCard label="Completed" value={s?.completedToday ?? "—"} accent="success" />
        <MetricCard
          label={isClient ? "Spend today" : "Revenue today"}
          value={s ? formatRwf(s.transportCostToday) : "—"}
          icon={<Wallet className="size-4" />}
        />
        {!isClient ? (
          <MetricCard
            label="Open incidents"
            value={alerts.length}
            accent="danger"
            icon={<Route className="size-4" />}
          />
        ) : (
          <MetricCard label="Members" value={s?.employeesCount ?? "—"} />
        )}
      </div>

      {!isClient ? (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text">Live fleet</h2>
              <p className="text-xs text-text-muted">From GET /fleet/live</p>
            </div>
            <Link href="/admin/live" className="text-xs font-medium text-primary">
              Open live ops
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={motorcycles}
              selectedId={selectedId}
              connecting={connecting}
              onSelect={(m) => dispatch(setSelectedMotorcycleId(m.id))}
              className="h-[280px] sm:h-[360px]"
            />
          </div>
        </Card>

        <Card className="xl:col-span-2" padding="md">
          <h2 className="text-sm font-semibold text-text mb-3">Recent alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-text-muted">No recent alerts from dashboard.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text">{a.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{a.detectedAt}</p>
                  </div>
                  <StatusBadge
                    status={
                      a.severity.toUpperCase().includes("HIGH") ||
                      a.severity.toUpperCase().includes("CRIT")
                        ? "unauthorized"
                        : "pending"
                    }
                    label={a.severity}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      ) : (
        <Card padding="md">
          <h2 className="text-sm font-semibold text-text mb-2">Your workspace</h2>
          <p className="text-sm text-text-secondary">
            Kampere Motari operates the rider fleet. Use Requests, Trips, Employees, and Billing
            to manage your company&apos;s transport.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/requests" className="text-xs font-medium text-primary">
              View requests
            </Link>
            <Link href="/admin/trips" className="text-xs font-medium text-primary">
              View trips
            </Link>
            <Link href="/admin/billing" className="text-xs font-medium text-primary">
              View billing
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
