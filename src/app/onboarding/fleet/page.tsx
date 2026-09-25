"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createMotorcycle, updateOnboarding } from "@/lib/api/resources";
import { useAppSelector } from "@/store";
import { Bike, FileUp, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingFleetPage() {
  const router = useRouter();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const companyType = useAppSelector((s) => s.auth.companyType);
  const [mode, setMode] = useState<"choose" | "add">("choose");
  const [plate, setPlate] = useState("");
  const [fleetNumber, setFleetNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyType === "CLIENT" && companyId) {
      void updateOnboarding(companyId, { fleetAdded: true })
        .catch(() => undefined)
        .finally(() => {
          router.replace("/onboarding/team");
        });
    }
  }, [companyType, companyId, router]);

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

  if (companyType === "CLIENT") {
    return (
      <Card className="shadow-[var(--shadow-soft)]" padding="lg">
        <p className="text-sm text-text-secondary">Skipping fleet setup…</p>
      </Card>
    );
  }

  if (mode === "add") {
    return (
      <Card className="shadow-[var(--shadow-soft)]" padding="lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text tracking-tight">Add a motorcycle</h1>
          <p className="mt-1 text-sm text-text-secondary">
            You can add more bikes later from Fleet.
          </p>
        </div>
        <form className="space-y-4" onSubmit={saveMotorcycle}>
          <Field label="Plate number">
            <Input value={plate} onChange={(e) => setPlate(e.target.value)} required />
          </Field>
          <Field label="Fleet number" hint="Optional internal code">
            <Input value={fleetNumber} onChange={(e) => setFleetNumber(e.target.value)} />
          </Field>
          <Field label="Brand / model" hint="Optional">
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Honda Ace"
            />
          </Field>
          {error ? (
            <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
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
        <h1 className="text-xl font-semibold text-text tracking-tight">Fleet setup</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add your first motorcycle now, or skip and finish later.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("add")}
          className="rounded-[12px] border border-border bg-surface p-5 text-left hover:border-primary/40 transition-colors"
        >
          <Bike className="size-5 text-primary mb-3" />
          <p className="font-semibold text-text">Add motorcycle</p>
          <p className="text-sm text-text-secondary mt-1">Plate, fleet number, brand</p>
        </button>
        <button
          type="button"
          onClick={() => void finish(true)}
          disabled={loading}
          className="rounded-[12px] border border-border bg-surface p-5 text-left hover:border-primary/40 transition-colors"
        >
          <SkipForward className="size-5 text-text-muted mb-3" />
          <p className="font-semibold text-text">Skip for now</p>
          <p className="text-sm text-text-secondary mt-1">Mark fleet step complete</p>
        </button>
      </div>
      <div className="rounded-[12px] border border-dashed border-border p-4 text-sm text-text-secondary flex gap-2">
        <FileUp className="size-4 shrink-0 mt-0.5" />
        Bulk CSV import can come later from the Fleet page.
      </div>
    </div>
  );
}
