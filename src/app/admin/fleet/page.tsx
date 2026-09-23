"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchMotorcycles } from "@/lib/api/resources";
import { mapMotorcycle } from "@/lib/api/mappers";
import { useAppSelector } from "@/store";
import type { Motorcycle } from "@/types";
import { Bike, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function FleetPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Motorcycle[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMotorcycles(companyId, {
        page,
        limit: 20,
        search: search || undefined,
        sort: "createdAt:DESC",
      });
      setItems(result.items.map(mapMotorcycle));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet");
    } finally {
      setLoading(false);
    }
  }, [companyId, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const online = items.filter((m) => m.gpsStatus !== "offline").length;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Fleet"
        description="Registered motorcycles"
        actions={
          <Link href="/admin/fleet/new">
            <Button size="sm">
              <Plus className="size-4" />
              Add motorcycle
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total" value={total} icon={<Bike className="size-4" />} />
        <MetricCard label="On this page" value={items.length} accent="primary" />
        <MetricCard label="Online (page)" value={online} accent="success" />
        <MetricCard label="Offline (page)" value={items.length - online} />
      </div>

      <SearchInput
        placeholder="Search plate or code…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-md"
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading fleet…" />
        ) : items.length === 0 ? (
          <EmptyState title="No motorcycles" description="Add your first unit." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/fleet/${m.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted/60"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">{m.plate}</p>
                    <p className="text-xs text-text-secondary">
                      {m.fleetNumber} · {m.brand} {m.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.gpsStatus} />
                    <StatusBadge status={m.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  );
}
