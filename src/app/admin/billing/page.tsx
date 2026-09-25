"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapInvoice } from "@/lib/api/mappers";
import {
  fetchBilling,
  fetchCompany,
  fetchInvoices,
  fetchOperatorClientCompanies,
  type BillingRecordDto,
} from "@/lib/api/resources";
import { calculateFare, formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Invoice } from "@/types";
import { FileText, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

export default function BillingPage() {
  const homeCompanyId = useAppSelector((s) => s.auth.companyId);
  const companyName = useAppSelector((s) => s.auth.companyName);
  const companyType = useAppSelector((s) => s.auth.companyType);
  const role = useAppSelector((s) => s.auth.role);
  const isOperatorStaff =
    companyType === "OPERATOR" &&
    (role === "COMPANY_ADMIN" || role === "ACCOUNTANT" || role === "PLATFORM_ADMIN");

  const [scopeCompanyId, setScopeCompanyId] = useState(homeCompanyId);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billing, setBilling] = useState<BillingRecordDto[]>([]);
  const [currency, setCurrency] = useState("RWF");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = scopeCompanyId || homeCompanyId;

  useEffect(() => {
    setScopeCompanyId(homeCompanyId);
  }, [homeCompanyId]);

  useEffect(() => {
    if (!isOperatorStaff) return;
    void fetchOperatorClientCompanies()
      .then((list) =>
        setClients(
          list
            .filter((c) => c.status === "ACTIVE" || c.status === "PENDING_REVIEW")
            .map((c) => ({ id: c.id, name: c.name })),
        ),
      )
      .catch(() => setClients([]));
  }, [isOperatorStaff]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [inv, bill, company] = await Promise.all([
        fetchInvoices(companyId, { limit: 20, sort: "periodStart:DESC" }),
        fetchBilling(companyId, { limit: 100, sort: "createdAt:DESC" }),
        fetchCompany(companyId).catch(() => null),
      ]);
      setInvoices(inv.items.map(mapInvoice));
      setBilling(bill.items);
      if (company?.currency) setCurrency(company.currency);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const scopeLabel =
    clients.find((c) => c.id === companyId)?.name ??
    (companyId === homeCompanyId ? companyName : "Selected company");

  const currentPeriod =
    invoices.find((i) => i.status === "pending") ?? invoices[0] ?? null;
  const billed = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const unbilled = billing
    .filter((b) => {
      const s = b.billingStatus.toUpperCase();
      return s === "PENDING" || s === "BILLED";
    })
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  const monthlySpend = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of billing) {
      const key = monthKey(b.createdAt);
      map.set(key, (map.get(key) ?? 0) + Number(b.totalAmount || 0));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => ({ month: monthLabel(key), amount }));
  }, [billing]);

  const tripsByWeek = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of billing) {
      const key = weekKey(b.createdAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4)
      .map(([week, trips], i) => ({ week: `W${i + 1}`, trips, raw: week }));
  }, [billing]);

  const maxSpend = Math.max(...monthlySpend.map((m) => m.amount), 1);
  const maxTrips = Math.max(...tripsByWeek.map((w) => w.trips), 1);
  const fareExample = useMemo(() => calculateFare(6.3), []);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Billing"
        description={`Trip km and amounts for ${scopeLabel || "your company"} — payment proof between Kampere Motari and the client.`}
        actions={
          <Link href="/admin/invoices">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="size-3.5" />}>
              View invoices
            </Button>
          </Link>
        }
      />

      {isOperatorStaff && clients.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-[12px] border border-border bg-surface px-4 py-3">
          <p className="text-sm text-text-secondary">
            Select a client company to review trip billing proof and prepare payment requests.
          </p>
          <select
            className="h-10 rounded-[8px] border border-border bg-surface px-3 text-sm text-text"
            value={companyId}
            onChange={(e) => setScopeCompanyId(e.target.value)}
          >
            <option value={homeCompanyId}>
              {companyName || "Kampere Motari"} (own trips)
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading billing…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Current period cost"
              value={formatRwf(currentPeriod?.amount ?? 0)}
              hint={currentPeriod?.period ?? "No invoices yet"}
              accent="primary"
              icon={<Wallet className="size-4" />}
            />
            <MetricCard
              label="Unbilled"
              value={formatRwf(unbilled)}
              hint="Trips not yet invoiced"
              accent="warning"
            />
            <MetricCard
              label="Billed"
              value={formatRwf(billed)}
              hint="Paid invoices"
              accent="success"
            />
            <MetricCard
              label="Outstanding"
              value={formatRwf(outstanding)}
              hint="Pending + overdue"
              accent="danger"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="text-base font-semibold text-text">Monthly spend</h2>
              <p className="text-xs text-text-muted mt-0.5">
                From billing records · {currency}
              </p>
              {monthlySpend.length === 0 ? (
                <p className="mt-8 text-sm text-text-muted text-center">No spend data yet.</p>
              ) : (
                <div className="mt-5 flex items-end gap-2 sm:gap-3 h-40">
                  {monthlySpend.map((m) => {
                    const height = Math.max((m.amount / maxSpend) * 100, 6);
                    return (
                      <div
                        key={m.month}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                      >
                        <span className="text-[10px] text-text-muted tabular-nums">
                          {(m.amount / 1_000).toFixed(0)}k
                        </span>
                        <div
                          className="w-full rounded-t-[6px] bg-primary/80 hover:bg-primary transition-colors"
                          style={{ height: `${height}%` }}
                          title={formatRwf(m.amount)}
                        />
                        <span className="text-xs font-medium text-text-secondary">
                          {m.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-text">Trips by week</h2>
              <p className="text-xs text-text-muted mt-0.5">From recent billing records</p>
              {tripsByWeek.length === 0 ? (
                <p className="mt-8 text-sm text-text-muted text-center">No trip data yet.</p>
              ) : (
                <div className="mt-5 flex items-end gap-3 sm:gap-4 h-40">
                  {tripsByWeek.map((w) => {
                    const height = Math.max((w.trips / maxTrips) * 100, 6);
                    return (
                      <div
                        key={w.raw}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                      >
                        <span className="text-[10px] text-text-muted tabular-nums">
                          {w.trips}
                        </span>
                        <div
                          className="w-full rounded-t-[6px] bg-success/70 hover:bg-success transition-colors"
                          style={{ height: `${height}%` }}
                          title={`${w.trips} trips`}
                        />
                        <span className="text-xs font-medium text-text-secondary">
                          {w.week}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card padding="none" className="lg:col-span-3 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-text">Recent invoices</h2>
                  <p className="text-xs text-text-muted mt-0.5">Latest billing documents</p>
                </div>
                <Link href="/admin/invoices" className="text-xs font-medium text-primary">
                  See all
                </Link>
              </div>
              {invoices.length === 0 ? (
                <p className="px-4 py-8 text-sm text-text-muted text-center">
                  No invoices yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {invoices.slice(0, 6).map((inv) => (
                    <li key={inv.id}>
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text">{inv.number}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {inv.period} · {inv.trips} lines
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-text">
                            {formatRwf(inv.amount)}
                          </p>
                          <div className="mt-1 flex justify-end">
                            <StatusBadge status={inv.status} />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <h2 className="text-base font-semibold text-text">Pricing rule</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Company transport fare structure
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-surface-muted/40 px-3 py-2.5">
                  <span className="text-text-secondary">First kilometre</span>
                  <span className="font-semibold text-text">500 RWF</span>
                </div>
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-surface-muted/40 px-3 py-2.5">
                  <span className="text-text-secondary">Each additional km</span>
                  <span className="font-semibold text-text">400 RWF</span>
                </div>
              </div>
              <div className="mt-5 rounded-[10px] border border-border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Example · 6.3 km
                </p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">First km</dt>
                    <dd className="font-medium text-text">500 RWF</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">
                      Remaining {fareExample.remainingKm.toFixed(1)} km
                    </dt>
                    <dd className="font-medium text-text">
                      {formatRwf(fareExample.remainingCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <dt className="font-semibold text-text">Total</dt>
                    <dd className="font-semibold text-primary">
                      {formatRwf(fareExample.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
