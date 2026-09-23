"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/overlay";
import {
  createMember,
  fetchMembers,
  updateMember,
  type MemberDto,
} from "@/lib/api/resources";
import { mapMemberToSupervisor } from "@/lib/api/mappers";
import { isValidEmail, isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/validation/rwanda";
import { useAppSelector } from "@/store";
import type { Supervisor } from "@/types";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

export default function SupervisorsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Supervisor[]>([]);
  const [rawMembers, setRawMembers] = useState<MemberDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "SUPERVISOR",
  });

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMembers(companyId, { page, limit: 20 });
      const supervisors = result.items.filter(
        (m) =>
          m.role === "SUPERVISOR" ||
          m.role === "ACCOUNTANT" ||
          m.role === "COMPANY_ADMIN",
      );
      setRawMembers(supervisors);
      setItems(supervisors.map(mapMemberToSupervisor));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [companyId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "SUPERVISOR",
    });
    setInviteHint(null);
    setAddOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    const email = form.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    let phone: string | undefined;
    if (form.phone.trim()) {
      if (!isValidRwandaPhone(form.phone)) {
        setError("Phone must be a valid Rwanda number (e.g. 0788123456 or +250788123456).");
        return;
      }
      phone = normalizeRwandaPhone(form.phone) ?? undefined;
    }
    setBusy(true);
    setError(null);
    try {
      await createMember(companyId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phone,
        role: form.role,
        status: "INVITED",
      });
      setInviteHint(
        `Invite sent to ${email}. They must open the activation email (phone or PC), set a password, then sign in.`,
      );
      setAddOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(member: MemberDto, status: string) {
    if (!companyId) return;
    setBusy(true);
    try {
      await updateMember(companyId, member.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1200px] mx-auto">
      <PageHeader
        title="Supervisors & accountants"
        description="Invite ops supervisors (riders, fleet, requests) or accountants (billing, trips, money). Only company admins can add users."
        actions={
          <Button type="button" onClick={openAdd}>
            <Plus className="size-4" />
            Invite member
          </Button>
        }
      />

      {inviteHint ? (
        <p className="text-sm rounded-[8px] px-3 py-2 bg-success-soft text-success">{inviteHint}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState title="No staff members found on this page" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((s, idx) => {
              const raw = rawMembers[idx];
              return (
                <li key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{s.name}</p>
                    <p className="text-xs text-text-secondary">
                      {s.email} · {s.phone} · {s.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={s.status === "active" ? "available" : "offline"}
                      label={s.status}
                    />
                    {raw && raw.status.toUpperCase() === "ACTIVE" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void setStatus(raw, "SUSPENDED")}
                      >
                        Suspend
                      </Button>
                    ) : raw ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void setStatus(raw, "ACTIVE")}
                      >
                        Activate
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Invite supervisor / accountant">
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field label="Last name">
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Email" hint="Required — invite + activation sent here">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Phone (Rwanda)" hint="Optional · 0788… or +250788…">
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+2507…"
            />
          </Field>
          <Field label="Role">
            <select
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="SUPERVISOR">Supervisor — riders, fleet, requests</option>
              <option value="ACCOUNTANT">Accountant — trips, billing, invoices</option>
            </select>
          </Field>
          <p className="text-xs text-text-muted">
            They receive an activation email (not a shared dashboard link). After activating on
            phone or PC, they sign in with email + their own password. No OTP.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending invite…" : "Send activation email"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
