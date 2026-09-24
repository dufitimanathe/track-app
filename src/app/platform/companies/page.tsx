"use client";

import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  fetchPlatformCompanies,
  type CompanyStatus,
  type PlatformCompany,
} from "@/lib/api/platform";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function statusTone(status: CompanyStatus) {
  if (status === "ACTIVE") return "approved" as const;
  if (status === "PENDING_REVIEW") return "pending" as const;
  if (status === "REJECTED") return "rejected" as const;
  if (status === "SUSPENDED") return "suspended" as const;
  return "draft" as const;
}

function CompaniesContent() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as CompanyStatus | null) ?? "";
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PlatformCompany[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPlatformCompanies({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: (status || undefined) as CompanyStatus | undefined,
      });
      setItems(result.items);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Review registrations, validate documents, and manage company admins."
        actions={
          <Link
            href="/platform/companies/new"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="size-4" /> Register company
          </Link>
        }
      />

      <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Search" className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              className="pl-9"
              placeholder="Name, email, registration number…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </Field>
        <Field label="Status" className="sm:w-56">
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as CompanyStatus | "");
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Field>
      </Card>

      {error && (
        <Card padding="md" className="border-danger/30 bg-danger-soft text-danger text-sm">
          {error}
        </Card>
      )}

      {loading ? (
        <Card padding="lg" className="text-sm text-text-secondary">
          Loading companies…
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="No companies found"
          description="Register a client company or wait for self-serve registrations from the home page."
        />
      ) : (
        <div className="space-y-3">
          {items.map((company) => (
            <Link key={company.id} href={`/platform/companies/${company.id}`}>
              <Card padding="md" className="transition hover:border-primary/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-text">{company.name}</h2>
                      <StatusBadge status={statusTone(company.status)} />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {company.email || "No email"} · {company.phone || "No phone"}
                      {company.registrationNumber
                        ? ` · Reg ${company.registrationNumber}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {company.adminCount ?? 0} admin(s) · {company.documentCount ?? 0} doc(s)
                    {(company.pendingDocumentCount ?? 0) > 0
                      ? ` · ${company.pendingDocumentCount} pending`
                      : ""}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          <p className="text-xs text-text-muted">{total} companies</p>
        </div>
      )}
    </div>
  );
}

export default function PlatformCompaniesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-text-secondary">Loading…</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
