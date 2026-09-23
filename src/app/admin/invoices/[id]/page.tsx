"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapInvoice } from "@/lib/api/mappers";
import {
  fetchCompany,
  fetchInvoice,
  type InvoiceDto,
  type InvoiceLineDto,
} from "@/lib/api/resources";
import { formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Invoice } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const companyName = useAppSelector((s) => s.auth.companyName);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [raw, setRaw] = useState<InvoiceDto | null>(null);
  const [companyMeta, setCompanyMeta] = useState<{
    address?: string | null;
    email?: string | null;
    phone?: string | null;
    currency?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId || !params.id) return;
    setLoading(true);
    setError(null);
    try {
      const [dto, company] = await Promise.all([
        fetchInvoice(companyId, params.id),
        fetchCompany(companyId).catch(() => null),
      ]);
      setRaw(dto);
      setInvoice(mapInvoice(dto));
      if (company) {
        setCompanyMeta({
          address: company.address,
          email: company.email,
          phone: company.phone,
          currency: company.currency,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto py-16 text-center text-sm text-text-muted">
        Loading invoice…
      </div>
    );
  }

  if (!invoice || !raw) {
    return (
      <div className="max-w-[960px] mx-auto py-16 text-center space-y-3">
        <h1 className="text-xl font-semibold text-text">Invoice not found</h1>
        <p className="text-sm text-text-secondary">{error ?? "No invoice for this id."}</p>
        <Link href="/admin/invoices" className="text-sm text-primary">
          Back to invoices
        </Link>
      </div>
    );
  }

  const lines: InvoiceLineDto[] = raw.lines ?? [];
  const subtotal = Number(raw.subtotal || 0);
  const total = Number(raw.total || invoice.amount);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[960px] mx-auto">
      <div>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text mb-3"
        >
          <ArrowLeft className="size-4" />
          Back to invoices
        </Link>
        <PageHeader
          title={invoice.number}
          description={`Billing period ${invoice.period}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={invoice.status} />
        <span className="text-xs text-text-muted">
          Issued {invoice.issuedDate} · Due {invoice.dueDate}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Billed to
          </h2>
          <p className="mt-2 text-base font-semibold text-text">{companyName}</p>
          {companyMeta.address ? (
            <p className="mt-1 text-sm text-text-secondary">{companyMeta.address}</p>
          ) : null}
          {companyMeta.email ? (
            <p className="mt-1 text-sm text-text-secondary">{companyMeta.email}</p>
          ) : null}
          {companyMeta.phone ? (
            <p className="text-sm text-text-secondary">{companyMeta.phone}</p>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Invoice summary
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Lines</dt>
              <dd className="font-medium text-text">{lines.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Currency</dt>
              <dd className="font-medium text-text">
                {raw.currency || companyMeta.currency || "RWF"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Period</dt>
              <dd className="font-medium text-text">{invoice.period}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text">Line items</h2>
          <p className="text-xs text-text-muted mt-0.5">Trips and charges on this invoice</p>
        </div>

        {lines.length === 0 ? (
          <p className="px-4 py-8 text-sm text-text-muted text-center">No line items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Trip</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-text">{row.description}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {row.tripId ? (
                        <Link
                          href={`/admin/trips/${row.tripId}`}
                          className="text-primary hover:underline"
                        >
                          {row.tripId.slice(0, 8)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">
                      {formatRwf(Number(row.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border px-4 py-4 space-y-2 text-sm max-w-sm ml-auto">
          <div className="flex justify-between">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-medium text-text">{formatRwf(subtotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold text-text">Invoice total</span>
            <span className="font-semibold text-primary text-base">
              {formatRwf(total)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
