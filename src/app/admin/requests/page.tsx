"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader, Tabs } from "@/components/ui/page-header";
import { Avatar, Drawer } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { approveRequest, fetchTransportRequests, rejectRequest } from "@/lib/api/resources";
import { mapTransportRequest } from "@/lib/api/mappers";
import { calculateFare, formatKm, formatRwf, initials } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedRequestId } from "@/store/slices/ui-slice";
import type { RequestStatus, TransportRequest } from "@/types";
import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type RequestTab = "pending" | "approved" | "rejected" | "cancelled" | "all";

const TAB_TO_API: Record<RequestTab, string | undefined> = {
  pending: "PENDING_APPROVAL",
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  all: undefined,
};

export default function RequestsPage() {
  const dispatch = useAppDispatch();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const selectedId = useAppSelector((s) => s.ui.selectedRequestId);
  const [tab, setTab] = useState<RequestTab>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TransportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTransportRequests(companyId, {
        page,
        limit: 20,
        search: query || undefined,
        status: TAB_TO_API[tab],
        sort: "requestedAt:DESC",
      });
      setItems(result.items.map(mapTransportRequest));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [companyId, page, query, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, query]);

  const selected = items.find((r) => r.id === selectedId) ?? null;
  const fare = selected ? calculateFare(selected.estimatedDistanceKm) : null;

  async function decide(id: string, action: "approve" | "reject") {
    if (!companyId) return;
    setBusyId(id);
    try {
      if (action === "approve") await approveRequest(companyId, id);
      else await rejectRequest(companyId, id, "Rejected from web console");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(
    () => ({
      pending: tab === "pending" ? total : undefined,
      approved: tab === "approved" ? total : undefined,
      rejected: tab === "rejected" ? total : undefined,
      cancelled: tab === "cancelled" ? total : undefined,
      all: tab === "all" ? total : undefined,
    }),
    [tab, total],
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Transport Requests"
        description="Review and approve employee transport requests"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { id: "pending", label: "Pending", count: counts.pending },
            { id: "approved", label: "Approved", count: counts.approved },
            { id: "rejected", label: "Rejected", count: counts.rejected },
            { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            { id: "all", label: "All", count: counts.all },
          ]}
          active={tab}
          onChange={(id) => setTab(id as RequestTab)}
        />
        <SearchInput
          placeholder="Search employee, pickup, destination…"
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
          <EmptyState title="Loading requests…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="No requests"
            description="Nothing matches this filter."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-surface-muted/60 transition-colors"
                  onClick={() => dispatch(setSelectedRequestId(r.id))}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar initials={initials(r.employeeName)} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text truncate">
                          {r.pickup} → {r.destination}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {r.employeeName} · {r.department ?? "—"} · {r.createdAt}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={r.status as RequestStatus} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted pl-11">
                    <span>{formatKm(r.estimatedDistanceKm)}</span>
                    <span>{formatRwf(r.estimatedCost)}</span>
                    <span className="uppercase">{r.channel}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Drawer
        open={Boolean(selected)}
        onClose={() => dispatch(setSelectedRequestId(null))}
        title={selected?.id ?? "Request"}
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-text">
                {selected.pickup} → {selected.destination}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {selected.employeeName} · {selected.employeePhone}
              </p>
            </div>
            <StatusBadge status={selected.status} />
            {fare ? (
              <p className="text-sm text-text-secondary">
                Est. fare {formatRwf(fare.total)} · {formatKm(selected.estimatedDistanceKm)}
              </p>
            ) : null}
            {selected.status === "pending" ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={busyId === selected.id}
                  onClick={() => void decide(selected.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  fullWidth
                  disabled={busyId === selected.id}
                  onClick={() => void decide(selected.id, "approve")}
                >
                  Approve
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
