"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateOnboarding } from "@/lib/api/resources";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { Bike, MapPin, ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string; hint?: string };

const FLEET_SIZES: Option[] = [
  { id: "1-10", label: "1–10", hint: "Starter fleet" },
  { id: "11-30", label: "11–30", hint: "Growing ops" },
  { id: "31-75", label: "31–75", hint: "Mid-size" },
  { id: "75+", label: "75+", hint: "Enterprise" },
];

const RIDER_COUNTS: Option[] = [
  { id: "1-10", label: "1–10 riders" },
  { id: "11-25", label: "11–25 riders" },
  { id: "26-50", label: "26–50 riders" },
  { id: "50+", label: "50+ riders" },
];

const TRACKING_OPTIONS: Option[] = [
  {
    id: "phone",
    label: "Rider phone GPS",
    hint: "Recommended — mobile app tracks bikes",
  },
  {
    id: "hybrid",
    label: "Phone + some hardware",
    hint: "Mix of app and devices",
  },
  {
    id: "hardware",
    label: "Hardware GPS later",
    hint: "Optional expensive devices",
  },
];

const APPROVAL_OPTIONS: Option[] = [
  { id: "always", label: "Always required", hint: "Supervisor approves first" },
  { id: "policy", label: "By policy", hint: "Rules by dept / time" },
  { id: "auto", label: "Auto-assign", hint: "Trusted requests skip queue" },
];

function SelectorGrid({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-[10px] border px-3 py-3 text-left transition-colors",
              active
                ? "border-primary bg-primary-soft ring-1 ring-primary/30"
                : "border-border bg-surface hover:bg-surface-muted",
            )}
          >
            <p className={cn("text-sm font-semibold", active ? "text-primary" : "text-text")}>
              {opt.label}
            </p>
            {opt.hint ? (
              <p className="mt-0.5 text-xs text-text-muted">{opt.hint}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingOperationsPage() {
  const router = useRouter();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [fleetSize, setFleetSize] = useState("31-75");
  const [riders, setRiders] = useState("26-50");
  const [tracking, setTracking] = useState("phone");
  const [approval, setApproval] = useState("always");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueNext() {
    if (!companyId) {
      router.replace("/register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Preferences are UI-only for now; mark ops step complete on the API.
      void fleetSize;
      void riders;
      void tracking;
      void approval;
      await updateOnboarding(companyId, { operationalSettingsCompleted: true });
      router.push("/onboarding/fleet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-[var(--shadow-soft)]" padding="lg">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-[10px] bg-primary-soft p-2 text-primary">
            <Bike className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text tracking-tight">
              Operations profile
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Tune defaults for dispatch, phone tracking, and approvals.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bike className="size-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Fleet size</h2>
          </div>
          <SelectorGrid
            options={FLEET_SIZES}
            value={fleetSize}
            onChange={setFleetSize}
            columns={4}
          />
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Riders</h2>
          </div>
          <SelectorGrid options={RIDER_COUNTS} value={riders} onChange={setRiders} />
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Location tracking</h2>
          </div>
          <SelectorGrid
            options={TRACKING_OPTIONS}
            value={tracking}
            onChange={setTracking}
          />
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Approval needed</h2>
          </div>
          <SelectorGrid
            options={APPROVAL_OPTIONS}
            value={approval}
            onChange={setApproval}
          />
        </section>

        {error ? (
          <p className="mt-4 text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-6 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/onboarding/company")}
          >
            Back
          </Button>
          <Button type="button" disabled={loading} onClick={() => void continueNext()}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
