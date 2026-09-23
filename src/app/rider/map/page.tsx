"use client";

import { ClassicFleetLegend, OpsMap } from "@/components/maps/ops-map";
import { Card } from "@/components/ui/card";
import { LiveIndicator, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapRiderMeMotorcycle } from "@/lib/api/mappers";
import { fetchRiderMe } from "@/lib/api/resources";
import { formatKm } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function RiderMapPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [myMoto, setMyMoto] = useState<Motorcycle | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const me = await fetchRiderMe(companyId);
      const moto = mapRiderMeMotorcycle(me);
      setMyMoto(moto);
      setSelectedId(moto?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title="Live map"
        description="Your motorcycle position from phone GPS."
        actions={<LiveIndicator />}
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      {loading && !myMoto ? (
        <p className="text-sm text-text-muted">Loading map…</p>
      ) : myMoto ? (
        <>
          <Card padding="md">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-text">{myMoto.plate}</p>
                <p className="text-xs text-text-secondary mt-0.5">{myMoto.location}</p>
              </div>
              <StatusBadge status={myMoto.status} />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {myMoto.speed > 0 ? `${myMoto.speed} km/h` : "Stopped"} ·{" "}
              {formatKm(myMoto.distanceTodayKm)} today · {myMoto.lastSeen}
            </p>
          </Card>

          <OpsMap
            motorcycles={[myMoto]}
            selectedId={selectedId}
            onSelect={(m) => setSelectedId(m.id)}
            className="h-[360px] sm:h-[420px]"
            compact
          />

          <ClassicFleetLegend />
        </>
      ) : (
        <Card padding="md">
          <p className="text-sm text-text-secondary">
            No motorcycle assigned yet. Ask your admin to assign a unit to your rider
            profile.
          </p>
        </Card>
      )}
    </div>
  );
}
