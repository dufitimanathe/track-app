"use client";

import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader, Tabs } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchTrips } from "@/lib/api/resources";
import { mapTrip } from "@/lib/api/mappers";
import { opsBasePath } from "@/lib/navigation";
import { formatKm, formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Trip, TripStatus } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TripTab = "all" | "active" | "completed" | "cancelled";

const TAB_STATUS: Record<TripTab, string | undefined> = {
  all: undefined,
  active: "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

export default function AdminTripsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const role = useAppSelector((s) => s.auth.role);
  const base = opsBasePath(role);
  const [tab, setTab] = useState<TripTab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTrips(companyId, {
        page,
        limit: 20,
        status: TAB_STATUS[tab],
        sort: "createdAt:DESC",
      });
      let mapped = result.items.map(mapTrip);
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        mapped = mapped.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.employeeName.toLowerCase().includes(q) ||
            t.riderName.toLowerCase().includes(q) ||
            t.pickup.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q),
        );
      }
      setItems(mapped);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [companyId, page, query, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader title="Trips" description="Company trip history and live assignments" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { id: "all", label: "All", count: tab === "all" ? total : undefined },
            { id: "active", label: "Active" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TripTab)}
        />
        <SearchInput
          placeholder="Filter loaded page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading trips…" />
        ) : items.length === 0 ? (
          <EmptyState title="No trips" description="Try another filter or page." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Rider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`${base}/trips/${t.id}`} className="font-medium text-primary">
                        {t.id.slice(0, 8)}…
                      </Link>
                      <p className="text-xs text-text-muted">{t.employeeName}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.pickup} → {t.destination}
                      <p className="text-xs text-text-muted">{formatKm(t.distanceKm)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {t.riderName}
                      <p className="text-xs text-text-muted">{t.motorcyclePlate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status as TripStatus} />
                    </td>
                    <td className="px-4 py-3">{formatRwf(t.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
