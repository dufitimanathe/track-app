"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import {
  activateAccountRequest,
} from "@/lib/api/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function ActivateForm() {
  const router = useRouter();
  const search = useSearchParams();
  const tokenFromQuery = useMemo(() => search.get("token") ?? "", [search]);
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError("Activation code is required (from your invite email).");
      return;
    }
    const normalized = token.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (normalized.length !== 6) {
      setError("Enter the 6-character code from your invite email.");
      return;
    }
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password needs 8+ characters with upper, lower, and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await activateAccountRequest({
        token: normalized,
        password,
      });
      setDoneEmail(result.email ?? null);
      window.setTimeout(() => {
        router.replace(
          `/login${result.email ? `?email=${encodeURIComponent(result.email)}` : ""}`,
        );
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <p className="text-center text-xs font-semibold tracking-[0.14em] uppercase text-text-muted mb-6">
          FleetOps
        </p>
        <Card className="shadow-[var(--shadow-soft)]" padding="lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text tracking-tight">
              Activate your account
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Enter the 6-character code from your invite email, then choose a password.
            </p>
          </div>

          {doneEmail ? (
            <p className="text-sm text-success bg-success-soft rounded-[8px] px-3 py-2">
              Account activated{doneEmail ? ` for ${doneEmail}` : ""}. Redirecting to sign in…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!tokenFromQuery ? (
                <Field label="Activation code">
                  <Input
                    value={token}
                    onChange={(e) =>
                      setToken(
                        e.target.value
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .toUpperCase()
                          .slice(0, 6),
                      )
                    }
                    placeholder="e.g. A7K3M2"
                    maxLength={6}
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                    className="font-mono tracking-[0.35em] text-center text-lg uppercase"
                  />
                </Field>
              ) : null}
              <Field label="New password">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, upper/lower/number"
                  required
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm password">
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />
              </Field>
              {error ? (
                <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">
                  {error}
                </p>
              ) : null}
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? "Activating…" : "Activate & continue"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-text-secondary">
            Already activated?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-text-secondary">
          Loading…
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
