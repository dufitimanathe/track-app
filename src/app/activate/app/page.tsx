"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function OpenAppInner() {
  const search = useSearchParams();
  const token = useMemo(() => {
    const raw = search.get("token") ?? "";
    return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  }, [search]);
  const [copied, setCopied] = useState(false);

  const browserActivateHref = token
    ? `/activate?token=${encodeURIComponent(token)}`
    : "/activate";

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-[420px] shadow-[var(--shadow-soft)]" padding="lg">
        <h1 className="text-xl font-semibold text-text tracking-tight">
          Activate your rider account
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Use the 6-character code from your email. Type it in the app, or activate in the
          browser below.
        </p>

        {!token ? (
          <p className="mt-4 text-sm text-danger">
            Missing activation code. Open the link from your invite email again.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Activation code
              </p>
              <p className="rounded-[8px] bg-surface-muted px-3 py-3 font-mono text-2xl font-semibold tracking-[0.35em] text-center text-text select-all">
                {token}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => void copyToken()}>
                {copied ? "Copied" : "Copy code"}
              </Button>
            </div>

            <Link
              href={browserActivateHref}
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-primary px-5 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Activate in browser
            </Link>

            <p className="text-xs text-text-muted">
              Or open FleetOps → Activate account → type the code → set your password → go
              Online.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already activated?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function ActivateAppPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-text-muted">Loading…</div>}>
      <OpenAppInner />
    </Suspense>
  );
}
