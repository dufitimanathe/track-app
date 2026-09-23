"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { fetchMapsStatus, type MapsStatus } from "@/lib/api/maps";
import {
  fetchCompany,
  updateCompany,
} from "@/lib/api/resources";
import { appConfig, isGoogleMapsEnabled } from "@/lib/config";
import { useAppSelector } from "@/store";
import { useEffect, useState } from "react";

export function TrackingSettingsCard() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [mapsStatus, setMapsStatus] = useState<MapsStatus | null>(null);
  const [mapsStatusError, setMapsStatusError] = useState<string | null>(null);
  const [shareMinutes, setShareMinutes] = useState("10");
  const [retentionDays, setRetentionDays] = useState("30");
  const [dailyLastOnly, setDailyLastOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMapsStatus()
      .then((status) => {
        if (!cancelled) {
          setMapsStatus(status);
          setMapsStatusError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMapsStatusError(err instanceof Error ? err.message : "Backend unreachable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void fetchCompany(companyId)
      .then((company) => {
        if (cancelled) return;
        setShareMinutes(String(company.trackingShareIntervalMinutes ?? 10));
        setRetentionDays(String(company.trackingHistoryRetentionDays ?? 30));
        setDailyLastOnly(company.trackingKeepDailyLastPingOnly ?? true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function onSave() {
    if (!companyId) return;
    const minutes = Number(shareMinutes);
    const days = Number(retentionDays);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 60) {
      setError("Share interval must be between 5 and 60 minutes.");
      return;
    }
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      setError("Retention must be between 1 and 3650 days.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateCompany(companyId, {
        trackingShareIntervalMinutes: minutes,
        trackingHistoryRetentionDays: days,
        trackingKeepDailyLastPingOnly: dailyLastOnly,
      });
      setMessage("Tracking policy saved. Riders pick it up on the next share session.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-text">Tracking & Maps</h2>
      <p className="mt-2 text-sm text-text-secondary">
        Phone-first tracking for low-end devices: riders share location on an interval, then
        stop sharing when they leave the motorcycle so the last fix is the parked reference.
      </p>

      <div className="mt-5 space-y-4 max-w-md">
        <Field label="Share location every (minutes)">
          <Input
            type="number"
            min={5}
            max={60}
            value={shareMinutes}
            onChange={(e) => setShareMinutes(e.target.value)}
          />
          <p className="mt-1 text-xs text-text-muted">
            Default 10. Higher = less battery / CPU use on rider phones.
          </p>
        </Field>
        <Field label="Keep history for (days)">
          <Input
            type="number"
            min={1}
            max={3650}
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            className="mt-1"
            checked={dailyLastOnly}
            onChange={(e) => setDailyLastOnly(e.target.checked)}
          />
          <span>
            Only keep the <strong>last location of each day</strong> per motorcycle (avoids storing
            every step). Live/parked position is always the latest fix.
          </span>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}
        <Button size="sm" disabled={busy || !companyId} onClick={() => void onSave()}>
          {busy ? "Saving…" : "Save tracking policy"}
        </Button>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-[10px] border border-border p-3">
          <dt className="text-xs uppercase tracking-wide text-text-muted">Browser Maps JS</dt>
          <dd className="mt-1 font-medium text-text">
            {isGoogleMapsEnabled() ? "Key present in frontend env" : "Not set — CSS map fallback"}
          </dd>
        </div>
        <div className="rounded-[10px] border border-border p-3">
          <dt className="text-xs uppercase tracking-wide text-text-muted">Backend routing</dt>
          <dd className="mt-1 font-medium text-text">
            {mapsStatus
              ? mapsStatus.googleConfigured
                ? `Google (${mapsStatus.provider})`
                : "Haversine fallback"
              : mapsStatusError ?? "Checking…"}
          </dd>
        </div>
        <div className="rounded-[10px] border border-border p-3">
          <dt className="text-xs uppercase tracking-wide text-text-muted">Tracking mode</dt>
          <dd className="mt-1 font-medium text-text">
            {mapsStatus?.trackingMode ?? "phone_primary"}
          </dd>
        </div>
        <div className="rounded-[10px] border border-border p-3">
          <dt className="text-xs uppercase tracking-wide text-text-muted">API</dt>
          <dd className="mt-1 font-medium text-text break-all text-xs">{appConfig.apiUrl}</dd>
        </div>
      </dl>
    </Card>
  );
}
