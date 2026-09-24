"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import {
  companyInitials,
  displayName,
  fetchMe,
  initialsOf,
  loginRequest,
  persistAuth,
  pickMembership,
} from "@/lib/api/auth";
import { isRememberMeEnabled, setRememberMe } from "@/lib/api/client";
import { destinationForMembership } from "@/lib/navigation";
import { useAppDispatch } from "@/store";
import { setSession } from "@/store/slices/auth-slice";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRemember(isRememberMeEnabled());
    const emailFromQuery = search.get("email");
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setRememberMe(rememberMe);
      const auth = await loginRequest({ email, password });
      persistAuth(auth, null, rememberMe);
      const me = await fetchMe();
      const membership = pickMembership(me.memberships);
      if (!membership) {
        throw new Error("No active company membership for this account.");
      }
      persistAuth(auth, membership.companyId, rememberMe);
      dispatch(
        setSession({
          userId: me.user.id,
          userName: displayName(me.user),
          userEmail: me.user.email ?? email,
          avatarInitials: initialsOf(me.user),
          role: membership.role,
          companyId: membership.companyId,
          companyName: membership.companyName,
          companyInitials: companyInitials(membership.companyName),
          companyStatus: membership.companyStatus ?? "ACTIVE",
          membershipId: membership.id,
        }),
      );
      const redirect = search.get("redirect");
      if (redirect && redirect.startsWith("/") && redirect !== "/") {
        router.replace(redirect);
      } else {
        router.replace(destinationForMembership(membership));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <p className="text-center text-xs font-semibold tracking-[0.14em] uppercase text-text-muted mb-6">
          FleetOps
        </p>

        <Card className="shadow-[var(--shadow-soft)]" padding="lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sign in to your company workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.rw"
                required
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me on this device
            </label>

            {error ? (
              <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
            ) : null}

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Login"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            New to FleetOps?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create workspace
            </Link>
          </p>
        </Card>
        <p className="mt-5 text-center text-sm text-text-secondary">
          <Link href="/" className="font-medium text-primary hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-text-secondary">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
