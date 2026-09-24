"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createPlatformCompany } from "@/lib/api/platform";
import {
  isValidEmail,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from "@/lib/validation/rwanda";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function PlatformRegisterCompanyPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    registrationNumber: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!isValidEmail(form.adminEmail)) {
      setError("Enter a valid admin email.");
      return;
    }
    if (form.phone.trim() && !isValidRwandaPhone(form.phone)) {
      setError("Company phone must be a valid Rwanda number.");
      return;
    }
    if (form.adminPhone.trim() && !isValidRwandaPhone(form.adminPhone)) {
      setError("Admin phone must be a valid Rwanda number.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const detail = await createPlatformCompany({
        company: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim()
            ? normalizeRwandaPhone(form.phone) ?? undefined
            : undefined,
          address: form.address.trim() || undefined,
          registrationNumber: form.registrationNumber.trim() || undefined,
        },
        admin: {
          firstName: form.adminFirstName.trim(),
          lastName: form.adminLastName.trim(),
          email: form.adminEmail.trim().toLowerCase(),
          phone: form.adminPhone.trim()
            ? normalizeRwandaPhone(form.adminPhone) ?? undefined
            : undefined,
        },
        activateImmediately: true,
      });
      const password = detail.admins[0]?.temporaryPassword;
      if (password) setTempPassword(password);
      router.push(`/platform/companies/${detail.company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register company");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Register company"
        description="Create a client company under Kampere Motari and invite its first company admin."
      />

      {error && (
        <Card padding="md" className="border-danger/30 bg-danger-soft text-danger text-sm">
          {error}
        </Card>
      )}
      {tempPassword && (
        <Card padding="md" className="border-warning/30 bg-warning-soft text-sm text-warning">
          Temporary admin password: <strong>{tempPassword}</strong>
        </Card>
      )}

      <Card padding="lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-sm font-semibold text-text">Company</h2>
          <Field label="Company name">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ops email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </Field>
          </div>
          <Field label="Registration number">
            <Input
              value={form.registrationNumber}
              onChange={(e) => update("registrationNumber", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>

          <h2 className="pt-2 text-sm font-semibold text-text">First company admin</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={form.adminFirstName}
                onChange={(e) => update("adminFirstName", e.target.value)}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.adminLastName}
                onChange={(e) => update("adminLastName", e.target.value)}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={form.adminEmail}
                onChange={(e) => update("adminEmail", e.target.value)}
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.adminPhone}
                onChange={(e) => update("adminPhone", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create & activate"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
