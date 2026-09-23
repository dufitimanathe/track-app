"use client";

import { Card, MetricCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { dashboardStats, monthlySpend, tripsByWeek } from "@/data/mock";
import { formatKm, formatRwf } from "@/lib/utils";
import { ClipboardList, Route, Users, Wallet } from "lucide-react";

export default function SupervisorReportsPage() {
  const maxSpend = Math.max(...monthlySpend.map((m) => m.amount));
  const maxTrips = Math.max(...tripsByWeek.map((w) => w.trips));

  return (
    <div className="max-w-[1100px] mx-auto space-y-5">
      <PageHeader
        title="Reports"
        description="Lightweight operational summaries for your supervised team."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Trips today"
          value={dashboardStats.tripsToday}
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          label="Completed"
          value={dashboardStats.completedToday}
          accent="success"
        />
        <MetricCard
          label="Distance"
          value={formatKm(dashboardStats.distanceTodayKm)}
          icon={<Route className="size-4" />}
        />
        <MetricCard
          label="Transport cost"
          value={formatRwf(dashboardStats.transportCostToday)}
          icon={<Wallet className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg">
          <h2 className="text-base font-semibold text-text">Trips by week</h2>
          <p className="text-xs text-text-muted mt-0.5">Current month</p>
          <div className="mt-5 flex items-end gap-3 h-36">
            {tripsByWeek.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-[8px] bg-primary/80 min-h-[4px]"
                  style={{ height: `${(w.trips / maxTrips) * 100}%` }}
                  title={`${w.trips} trips`}
                />
                <span className="text-[11px] text-text-muted">{w.week}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-base font-semibold text-text">Monthly spend</h2>
          <p className="text-xs text-text-muted mt-0.5">Company transport cost</p>
          <div className="mt-5 space-y-2.5">
            {monthlySpend.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-8 text-xs text-text-muted">{m.month}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${(m.amount / maxSpend) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-text tabular-nums w-24 text-right">
                  {formatRwf(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-start gap-3">
          <div className="rounded-[8px] bg-primary-soft p-2 text-primary">
            <Users className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Supervisor snapshot</p>
            <p className="text-sm text-text-secondary mt-1">
              {dashboardStats.availableRiders} riders available ·{" "}
              {dashboardStats.pendingRequests} pending approvals ·{" "}
              {dashboardStats.activeTrips} active trips.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
