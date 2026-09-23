"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  acknowledgeIncident,
  fetchIncidents,
  resolveIncident,
} from "@/lib/api/resources";
import { mapIncident } from "@/lib/api/mappers";
import { useAppSelector } from "@/store";
import type { Incident } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function IncidentsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIncidents(companyId, { page, limit: 20 });
      setItems(result.items.map(mapIncident));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, [companyId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "ack" | "resolve") {
    if (!companyId) return;
    try {
      if (action === "ack") await acknowledgeIncident(companyId, id);
      else await resolveIncident(companyId, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1200px] mx-auto">
      <PageHeader title="Incidents" description="Unauthorized movement, GPS offline, and alerts" />
      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState title="No incidents" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((inc) => (
              <li key={inc.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{inc.type}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{inc.description}</p>
                    <p className="text-[11px] text-text-muted mt-1">{inc.detectedAt}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={inc.severity} />
                    <StatusBadge status={inc.status === "open" ? "pending" : "available"} label={inc.status} />
                  </div>
                </div>
                {inc.status === "open" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void act(inc.id, "ack")}>
                      Acknowledge
                    </Button>
                    <Button size="sm" onClick={() => void act(inc.id, "resolve")}>
                      Resolve
                    </Button>
                  </div>
                ) : null}
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
