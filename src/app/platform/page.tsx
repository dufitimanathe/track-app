"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlatformOverview, type PlatformOverview } from "@/lib/api/platform";
import { Building2, ClipboardCheck, FileWarning, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function PlatformOverviewPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setOverview(await fetchPlatformOverview());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load overview");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      label: "Pending review",
      value: overview?.pendingReview ?? 0,
      href: "/platform/companies?status=PENDING_REVIEW",
      icon: ClipboardCheck,
    },
    {
      label: "Active companies",
      value: overview?.activeCompanies ?? 0,
      href: "/platform/companies?status=ACTIVE",
      icon: Building2,
    },
    {
      label: "Suspended",
      value: overview?.suspendedCompanies ?? 0,
      href: "/platform/companies?status=SUSPENDED",
      icon: Shield,
    },
    {
      label: "Docs to validate",
      value: overview?.pendingDocuments ?? 0,
      href: "/platform/companies?status=PENDING_REVIEW",
      icon: FileWarning,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Manage client companies for Kampere Motari — registration, document validation, and company admins."
        actions={
          <div className="flex gap-2">
            <Link
              href="/platform/companies"
              className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
            >
              All companies
            </Link>
            <Link
              href="/platform/companies/new"
              className="inline-flex h-10 items-center rounded-[8px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Register company
            </Link>
          </div>
        }
      />

      {error && (
        <Card padding="md" className="border-danger/30 bg-danger-soft text-danger text-sm">
          {error}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card padding="lg" className="h-full transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-secondary">{card.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-text">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary-soft p-2 text-primary">
                    <Icon className="size-4" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-base font-semibold text-text">How company onboarding works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
          <li>A client company registers from the home page (or you create one here).</li>
          <li>They submit registration details and supporting document links.</li>
          <li>You validate documents, then approve or reject the company.</li>
          <li>Once approved, their company admins can enrol employees and run operations.</li>
        </ol>
      </Card>
    </div>
  );
}
