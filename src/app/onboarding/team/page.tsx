"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createMember, createRider, updateOnboarding } from "@/lib/api/resources";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/validation/rwanda";
import { useAppSelector } from "@/store";
import { SkipForward, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "choose" | "supervisor" | "rider";

export default function OnboardingTeamPage() {
  const router = useRouter();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [mode, setMode] = useState<Mode>("choose");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(markTeam: boolean) {
    if (!companyId) {
      router.replace("/register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (markTeam) {
        await updateOnboarding(companyId, { teamAdded: true });
      }
      router.push("/onboarding/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to continue");
    } finally {
      setLoading(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    if (!isValidRwandaPhone(phone)) {
      setError("Phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
      return;
    }
    const normalizedPhone = normalizeRwandaPhone(phone);
    if (!normalizedPhone) {
      setError("Phone must be a valid Rwanda mobile number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const f = firstName.trim();
      const l = lastName.trim() || "Member";

      if (mode === "supervisor") {
        await createMember(companyId, {
          firstName: f,
          lastName: l,
          phone: normalizedPhone,
          email: email.trim() || undefined,
          role: "SUPERVISOR",
        });
      } else {
        if (!email.trim()) {
          setError("Email is required so the rider can activate the FleetOps mobile app.");
          setLoading(false);
          return;
        }
        await createRider(companyId, {
          firstName: f,
          lastName: l,
          phone: normalizedPhone,
          email: email.trim(),
        });
      }
      await finish(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
      setLoading(false);
    }
  }

  if (mode === "supervisor" || mode === "rider") {
    const title = mode === "supervisor" ? "Invite supervisor" : "Add rider";
    return (
      <Card className="shadow-[var(--shadow-soft)]" padding="lg">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {mode === "rider"
              ? "They get a mobile activation email, set a password in the FleetOps app, then go Online for GPS."
              : "They get a browser activation email, set a password, then sign in on web."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={invite}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Phone" hint="Rwanda mobile · 0788… or +250788…">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 788 000 000"
              required
            />
          </Field>
          <Field
            label="Email"
            hint={
              mode === "rider"
                ? "Required — activation opens the FleetOps phone app"
                : "Required for supervisor invite"
            }
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              {loading ? "Saving…" : "Send invite & continue"}
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
          Build your team
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Invite a supervisor, add a rider, or skip and finish setup.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setMode("supervisor")}
          className="rounded-[12px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] hover:border-primary hover:bg-primary-soft/40 transition-colors"
        >
          <div className="rounded-[10px] bg-primary-soft p-2 text-primary w-fit">
            <UserPlus className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text">Invite supervisor</p>
          <p className="mt-1 text-xs text-text-secondary">
            Approve requests and manage dispatch
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("rider")}
          className="rounded-[12px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-soft)] hover:border-primary hover:bg-primary-soft/40 transition-colors"
        >
          <div className="rounded-[10px] bg-success-soft p-2 text-success w-fit">
            <Users className="size-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text">Add rider</p>
          <p className="mt-1 text-xs text-text-secondary">
            Assign to a motorcycle after invite
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
            Invite your team from the dashboard later
          </p>
        </button>
      </div>

      <div className="flex justify-start pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/onboarding/fleet")}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
