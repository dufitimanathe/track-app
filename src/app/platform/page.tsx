"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlatformOverview, type PlatformOverview } from "@/lib/api/platform";
import {
  Activity,
  Bike,
  Building2,
  ClipboardCheck,
  FileWarning,
  MapPinned,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
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

  const companyCards = [
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

  const opsCards = [
    {
      label: "Trips completed",
      value: overview?.totalCompletedTrips ?? 0,
      href: "/admin/trips",
      icon: Activity,
      hint: "All client companies",
    },
    {
      label: "Completed today",
      value: overview?.tripsCompletedToday ?? 0,
      href: "/admin/trips",
      icon: MapPinned,
      hint: "UTC day",
    },
    {
      label: "Active riders",
      value: overview?.activeRiders ?? 0,
      href: "/admin/riders",
      icon: Users,
      hint: "Kampere Motari fleet",
    },
    {
      label: "Active motorcycles",
      value: overview?.activeMotorcycles ?? 0,
      href: "/admin/fleet",
      icon: Bike,
      hint: "Kampere Motari fleet",
    },
  ];

  const topCompanies = overview?.topCompaniesByTrips ?? [];
  const topEmployees = overview?.topEmployeesByTrips ?? [];
  const maxCompanyTrips = Math.max(1, ...topCompanies.map((c) => c.tripCount));
  const maxEmployeeTrips = Math.max(1, ...topEmployees.map((e) => e.tripCount));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kampere Motari overview"
        description="Platform insights across client companies, plus full access to Kampere Motari operations, billing, and fleet."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/live"
              className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
            >
              Live operations
            </Link>
            <Link
              href="/admin/billing"
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
            >
              <Wallet className="size-4" />
              Billing
            </Link>
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Client companies
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {companyCards.map((card) => {
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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Operations insights
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {opsCards.map((card) => {
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
                      <p className="mt-1 text-xs text-text-muted">{card.hint}</p>
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
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text">Companies moved most</h2>
            <p className="text-sm text-text-secondary">
              Client companies ranked by completed employee trips.
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : topCompanies.length === 0 ? (
            <p className="text-sm text-text-muted">No completed trips yet.</p>
          ) : (
            <ul className="space-y-3">
              {topCompanies.map((row, index) => (
                <li key={row.companyId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-text">
                      <span className="mr-2 text-text-muted">{index + 1}.</span>
                      {row.companyName}
                    </span>
                    <span className="shrink-0 tabular-nums text-text-secondary">
                      {row.tripCount} trips
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((row.tripCount / maxCompanyTrips) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text">Employees moved most</h2>
            <p className="text-sm text-text-secondary">
              Top employees by completed trips, with owning company.
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : topEmployees.length === 0 ? (
            <p className="text-sm text-text-muted">No completed trips yet.</p>
          ) : (
            <ul className="space-y-3">
              {topEmployees.map((row, index) => (
                <li key={row.employeeId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        <span className="mr-2 text-text-muted">{index + 1}.</span>
                        {row.employeeName}
                      </p>
                      <p className="truncate text-xs text-text-muted">{row.companyName}</p>
                    </div>
                    <span className="shrink-0 tabular-nums text-text-secondary">
                      {row.tripCount} trips
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((row.tripCount / maxEmployeeTrips) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
