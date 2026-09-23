"use client";

import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/lib/api/resources";
import { mapNotification } from "@/lib/api/mappers";
import { getStoredCompanyId } from "@/lib/api/client";
import { useAppSelector } from "@/store";
import type { NotificationItem } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const storeCompanyId = useAppSelector((s) => s.auth.companyId);
  const companyId = storeCompanyId || getStoredCompanyId() || "";
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hydrated || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifications(companyId, { page, limit: 20 });
      setItems(result.items.map(mapNotification));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [companyId, hydrated, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    if (!companyId) return;
    await markNotificationRead(companyId, id);
    await load();
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[900px] mx-auto">
      <PageHeader title="Notifications" description="Company inbox" />
      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}
      <Card padding="none" className="overflow-hidden">
        {!hydrated || loading ? (
          <EmptyState title="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text">{n.title}</p>
                    {!n.read ? <StatusBadge status="pending" label="Unread" /> : null}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{n.description}</p>
                  <p className="text-[11px] text-text-muted mt-1">{n.timestamp}</p>
                </div>
                {!n.read ? (
                  <Button size="sm" variant="secondary" onClick={() => void markRead(n.id)}>
                    Mark read
                  </Button>
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
