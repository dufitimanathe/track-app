"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchMe } from "@/lib/api/auth";
import { useAppSelector } from "@/store";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PendingApprovalPage() {
  const companyName = useAppSelector((s) => s.auth.companyName);
  const companyStatus = useAppSelector((s) => s.auth.companyStatus);
  const [status, setStatus] = useState(companyStatus);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStatus(companyStatus);
  }, [companyStatus]);

  async function refresh() {
    setRefreshing(true);
    try {
      const me = await fetchMe();
      const membership = me.memberships[0];
      if (membership?.companyStatus) {
        setStatus(membership.companyStatus);
        if (membership.companyStatus === "ACTIVE") {
          window.location.href = "/admin";
        }
      }
    } finally {
      setRefreshing(false);
    }
  }

  const rejected = status === "REJECTED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card padding="lg" className="w-full max-w-lg space-y-4 shadow-[var(--shadow-soft)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Kampere Motari
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-text">
            {rejected ? "Waitlist application needs attention" : "On the waitlist"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {rejected
              ? `${companyName || "Your company"} was not approved yet. Contact Kampere Motari or update your documents with support.`
              : `${companyName || "Your company"} is on the waitlist. Kampere Motari Super Admin will validate documents and approve you to work with us.`}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          Current status:{" "}
          <strong className="text-text">{(status || "PENDING_REVIEW").replaceAll("_", " ")}</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? "Checking…" : "Refresh status"}
          </Button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
          >
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
