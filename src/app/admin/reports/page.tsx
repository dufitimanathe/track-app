"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { mapDashboard } from "@/lib/api/mappers";
import { fetchDashboard } from "@/lib/api/resources";
import { cn, formatKm, formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { DashboardStats } from "@/types";
import { Download, FileBarChart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const categories = [
  {
    id: "trips",
    title: "Trip activity",
    description: "Completed, cancelled, and in-progress trips",
  },
  {
    id: "fleet",
    title: "Fleet utilization",
    description: "Online rate, distance, and idle time",
  },
  {
    id: "cost",
    title: "Transport cost",
    description: "Spend by department and period",
  },
  {
    id: "incidents",
    title: "Incidents",
    description: "Open alerts and resolution times",
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [category, setCategory] = useState("trips");
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [department, setDepartment] = useState("all");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const dash = await fetchDashboard(companyId);
      setStats(mapDashboard(dash));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = categories.find((c) => c.id === category)!;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Reports"
        description="Live operational summaries for trips, fleet, cost, and incidents."
        actions={
          <Button size="sm" leftIcon={<Download className="size-3.5" />} disabled>
            Export
          </Button>
        }
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const active = cat.id === category;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "text-left rounded-[12px] border p-4 transition-colors",
                active
                  ? "border-primary bg-primary-soft/50 ring-1 ring-primary/20"
                  : "border-border bg-surface hover:bg-surface-muted/60",
              )}
            >
              <div className="flex items-start gap-2">
                <FileBarChart
                  className={cn("size-4 mt-0.5", active ? "text-primary" : "text-text-muted")}
                />
                <div>
                  <p className="text-sm font-semibold text-text">{cat.title}</p>
                  <p className="text-xs text-text-secondary mt-1">{cat.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <h2 className="text-base font-semibold text-text">Filters</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {selected.title} · refine the reporting window
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Department">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="all">All departments</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
            </Select>
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Trips today"
          value={loading ? "—" : (stats?.tripsToday ?? 0)}
          accent="primary"
        />
        <MetricCard
          label="Completed"
          value={loading ? "—" : (stats?.completedToday ?? 0)}
          accent="success"
        />
        <MetricCard
          label="Distance"
          value={loading ? "—" : formatKm(stats?.distanceTodayKm ?? 0)}
        />
        <MetricCard
          label="Transport cost"
          value={loading ? "—" : formatRwf(stats?.transportCostToday ?? 0)}
        />
      </div>

      <Card>
        <EmptyState
          title="No detailed report rows"
          description={`${selected.title} detail tables will appear here when live records exist for ${from} → ${to}.`}
        />
      </Card>
    </div>
  );
}
