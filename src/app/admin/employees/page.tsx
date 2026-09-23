"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { Field, Input, PasswordInput, SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/overlay";
import {
  createEmployee,
  createMember,
  deactivateEmployee,
  fetchEmployees,
  updateEmployee,
  type EmployeeDto,
} from "@/lib/api/resources";
import { mapEmployee } from "@/lib/api/mappers";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/validation/rwanda";
import { useAppSelector } from "@/store";
import type { Employee } from "@/types";
import { Building2, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

export default function EmployeesPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Employee[]>([]);
  const [rawItems, setRawItems] = useState<EmployeeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    employeeCode: "",
    department: "",
    createLogin: false,
    password: "",
  });

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEmployees(companyId, {
        page,
        limit: 20,
        search: search || undefined,
        sort: "createdAt:DESC",
      });
      setRawItems(result.items);
      setItems(result.items.map(mapEmployee));
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [companyId, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setForm({
      fullName: "",
      phone: "",
      email: "",
      employeeCode: "",
      department: "",
      createLogin: false,
      password: "",
    });
    setTempPassword(null);
    setEditItem(null);
    setAddOpen(true);
  }

  function openEdit(dto: EmployeeDto) {
    setEditItem(dto);
    setForm({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email ?? "",
      employeeCode: dto.employeeCode ?? "",
      department: dto.department ?? "",
      createLogin: false,
      password: "",
    });
    setTempPassword(null);
    setAddOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    if (!isValidRwandaPhone(form.phone)) {
      setError("Phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
      return;
    }
    const phone = normalizeRwandaPhone(form.phone);
    if (!phone) {
      setError("Phone must be a valid Rwanda mobile number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editItem) {
        await updateEmployee(companyId, editItem.id, {
          fullName: form.fullName.trim(),
          phone,
          email: form.email.trim() || null,
          employeeCode: form.employeeCode.trim() || null,
          department: form.department.trim() || null,
        });
      } else {
        await createEmployee(companyId, {
          fullName: form.fullName.trim(),
          phone,
          email: form.email.trim() || undefined,
          employeeCode: form.employeeCode.trim() || undefined,
          department: form.department.trim() || undefined,
          canRequestTransport: true,
        });

        if (form.createLogin && form.email.trim()) {
          const [firstName, ...rest] = form.fullName.trim().split(/\s+/);
          const member = await createMember(companyId, {
            firstName: firstName || form.fullName.trim(),
            lastName: rest.join(" ") || "Employee",
            email: form.email.trim(),
            phone,
            role: "EMPLOYEE",
            password: form.password.trim() || undefined,
            status: "ACTIVE",
          });
          if (member.temporaryPassword) {
            setTempPassword(member.temporaryPassword);
          }
        }
      }
      setAddOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate(id: string) {
    if (!companyId) return;
    setBusy(true);
    try {
      await deactivateEmployee(companyId, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Employees"
        description="People who can request transport (WhatsApp / portal)"
        actions={
          <Button type="button" onClick={openAdd}>
            <Plus className="size-4" />
            Add employee
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <MetricCard label="Total" value={total} icon={<Users className="size-4" />} />
        <MetricCard
          label="Active (page)"
          value={items.filter((e) => e.status === "active").length}
          accent="success"
          icon={<Building2 className="size-4" />}
        />
      </div>

      <SearchInput
        placeholder="Search name, phone, department…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-md"
      />

      {tempPassword ? (
        <p className="text-sm rounded-[8px] px-3 py-2 bg-warning-soft text-warning">
          Login created. Temporary password: <strong>{tempPassword}</strong> — share securely.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <EmptyState title="Loading employees…" />
        ) : items.length === 0 ? (
          <EmptyState title="No employees" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((e, idx) => {
              const raw = rawItems[idx];
              return (
                <li key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{e.name}</p>
                    <p className="text-xs text-text-secondary">
                      {e.department} · {e.phone} · {e.employeeId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={e.status === "active" ? "available" : "offline"} label={e.status} />
                    {raw ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(raw)}>
                        Edit
                      </Button>
                    ) : null}
                    {e.status === "active" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onDeactivate(e.id)}
                      >
                        Deactivate
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editItem ? "Edit employee" : "Add employee"}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Full name">
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </Field>
          <Field label="Phone" hint="Rwanda mobile · 0788… or +250788…">
            <Input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+250 788 000 000"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code">
              <Input
                value={form.employeeCode}
                onChange={(e) => setForm((f) => ({ ...f, employeeCode: e.target.value }))}
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </Field>
          </div>
          {!editItem ? (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.createLogin}
                onChange={(e) => setForm((f) => ({ ...f, createLogin: e.target.checked }))}
              />
              Also create portal login (requires email)
            </label>
          ) : null}
          {form.createLogin && !editItem ? (
            <Field label="Password (optional — temp generated if blank)">
              <PasswordInput
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 chars, upper/lower/number"
                autoComplete="new-password"
              />
            </Field>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editItem ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
