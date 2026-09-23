"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapNotification } from "@/lib/api/mappers";
import { fetchNotifications, markNotificationRead } from "@/lib/api/resources";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { NotificationItem } from "@/types";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function RiderNotificationsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifications(companyId, { limit: 40 });
      setItems(result.items.map(mapNotification));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    if (!companyId) return;
    await markNotificationRead(companyId, id);
    await load();
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="Alerts" description="Trip assignments and system updates." />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState title="No alerts yet" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn("px-4 py-4", !n.read && "bg-primary-soft/30")}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 rounded-[8px] bg-surface-muted p-2 text-text-secondary shrink-0">
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text">{n.title}</p>
                      {n.critical ? <StatusBadge status="critical" /> : null}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{n.description}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-text-muted">{n.timestamp}</p>
                      {!n.read ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void markRead(n.id)}
                        >
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
