"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapRiderMeMotorcycle } from "@/lib/api/mappers";
import { fetchRiderMe } from "@/lib/api/resources";
import { clearSession as clearStorage, getRefreshToken } from "@/lib/api/client";
import { logoutRequest } from "@/lib/api/auth";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearSession } from "@/store/slices/auth-slice";
import type { Motorcycle } from "@/types";
import { Bike, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function RiderProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { userName, userEmail, avatarInitials, companyName, companyId } =
    useAppSelector((s) => s.auth);
  const [moto, setMoto] = useState<Motorcycle | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const me = await fetchRiderMe(companyId);
      setMoto(mapRiderMeMotorcycle(me));
      setPhone(me.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader title="Profile" description="Account and motorcycle assignment." />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Avatar initials={avatarInitials || "R"} size="lg" />
          <div>
            <p className="text-lg font-semibold text-text">{userName}</p>
            <p className="text-sm text-text-secondary">{userEmail}</p>
            <div className="mt-2">
              <StatusBadge status="on_trip" label="Rider" />
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Phone</dt>
            <dd className="font-medium text-text">{phone || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Company</dt>
            <dd className="font-medium text-text text-right">{companyName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Role</dt>
            <dd className="font-medium text-text">Rider</dd>
          </div>
        </dl>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bike className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Motorcycle assignment</h2>
        </div>
        {moto ? (
          <div className="rounded-[10px] border border-border bg-surface-muted/50 p-3">
            <p className="text-base font-semibold text-text">{moto.plate}</p>
            <p className="text-sm text-text-secondary mt-0.5">
              {moto.fleetNumber} · {moto.brand} {moto.model}
              {moto.year ? ` (${moto.year})` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={moto.status} />
              <StatusBadge
                status={moto.gpsStatus === "online" ? "online" : "gps_offline"}
                label={
                  moto.gpsStatus === "online"
                    ? "GPS Connected"
                    : moto.gpsStatus === "delayed"
                      ? "GPS Delayed"
                      : "GPS Offline"
                }
              />
            </div>
            <p className="text-xs text-text-muted mt-3">
              Color: {moto.color} · Last seen: {moto.lastSeen}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No motorcycle currently assigned.</p>
        )}
      </Card>

      <Button
        variant="danger-outline"
        fullWidth
        leftIcon={<LogOut className="size-4" />}
        onClick={() => {
          const refresh = getRefreshToken();
          void (async () => {
            if (refresh) await logoutRequest(refresh).catch(() => clearStorage());
            else clearStorage();
            dispatch(clearSession());
            router.push("/login");
          })();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
