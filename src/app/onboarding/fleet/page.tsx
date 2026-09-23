"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createMotorcycle, updateOnboarding } from "@/lib/api/resources";
import { useAppSelector } from "@/store";
import { Bike, FileUp, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingFleetPage() {
  const router = useRouter();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [mode, setMode] = useState<"choose" | "add">("choose");
  const [plate, setPlate] = useState("");
  const [fleetNumber, setFleetNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(markFleet: boolean) {
    if (!companyId) {
      router.replace("/register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (markFleet) {
        await updateOnboarding(companyId, { fleetAdded: true });
      }
      router.push("/onboarding/team");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue");
    } finally {
      setLoading(false);
    }
  }

  async function saveMotorcycle(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [brandName, ...modelParts] = brand.trim().split(/\s+/);
      await createMotorcycle(companyId, {
        plateNumber: plate.trim(),
        internalCode: fleetNumber.trim() || undefined,
        brand: brandName || undefined,
        model: modelParts.join(" ") || undefined,
      });
      await finish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add motorcycle");
      setLoading(false);
    }
  }

  if (mode === "add") {
    return (
      <Card className="shadow-[var(--shadow-soft)]" padding="lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text tracking-tight">
            Add motorcycle
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            You can add more units after onboarding.
          </p>
        </div>

        <form className="space-y-4" onSubmit={saveMotorcycle}>
          <Field label="Plate number">
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="RAE 428C"
              required
            />
          </Field>
          <Field label="Fleet number">
            <Input
              value={fleetNumber}
              onChange={(e) => setFleetNumber(e.target.value)}
              placeholder="VT-014"
            />
          </Field>
          <Field label="Brand / model">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="TVS Apache 160"
            />
          </Field>

          {error ? (
            <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setMode("choose")}>
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text tracking-tight">
          Seed your fleet
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add at least one motorcycle, or skip for now.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setMode("add")}
          className="rounded-[12px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] hover:border-primary hover:bg-primary-soft/40 transition-colors"
        >
          <div className="rounded-[10px] bg-primary-soft p-2 text-primary w-fit">
            <Bike className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text">Add motorcycle</p>
          <p className="mt-1 text-xs text-text-secondary">
            Enter plate and fleet details manually
          </p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => void finish(true)}
          className="rounded-[12px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] hover:border-primary hover:bg-primary-soft/40 transition-colors"
        >
          <div className="rounded-[10px] bg-surface-muted p-2 text-text-secondary w-fit">
            <FileUp className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text">Import later</p>
          <p className="mt-1 text-xs text-text-secondary">
            Mark fleet step done and continue
          </p>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => void finish(false)}
          className="rounded-[12px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] hover:border-border-strong transition-colors"
        >
          <div className="rounded-[10px] bg-surface-muted p-2 text-text-secondary w-fit">
            <SkipForward className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text">Skip</p>
          <p className="mt-1 text-xs text-text-secondary">
            Set up fleet later from the admin console
          </p>
        </button>
      </div>

      <div className="flex justify-start pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/onboarding/operations")}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
