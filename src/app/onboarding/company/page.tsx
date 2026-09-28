"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { registerCompanyRequest } from "@/lib/api/auth";
import { uploadCompanyDocumentFile } from "@/lib/api/uploads";
import { clearAdminDraft, loadAdminDraft } from "@/lib/onboarding-draft";
import {
  isValidEmail,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from "@/lib/validation/rwanda";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    registrationNumber: "",
    currency: "RWF",
    timezone: "Africa/Kigali",
  });
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [directorIdFile, setDirectorIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadAdminDraft();
    if (!draft) {
      router.replace("/register");
      return;
    }
    setForm((prev) => ({
      ...prev,
      name: draft.companyName || prev.name,
      email: draft.email || prev.email,
      phone: draft.phone || prev.phone,
    }));
  }, [router]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const admin = loadAdminDraft();
    if (!admin) {
      router.replace("/register");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (form.phone.trim() && !isValidRwandaPhone(form.phone)) {
        setError("Company phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
        setLoading(false);
        return;
      }
      if (form.email.trim() && !isValidEmail(form.email)) {
        setError("Enter a valid ops email address.");
        setLoading(false);
        return;
      }
      if (!admin.email || !isValidEmail(admin.email)) {
        setError("Your work email on the previous step is invalid. Go back and fix it.");
        setLoading(false);
        return;
      }
      if (!admin.phone || !isValidRwandaPhone(admin.phone)) {
        setError("Your phone on the previous step is invalid. Go back and fix it.");
        setLoading(false);
        return;
      }
      if (!form.registrationNumber.trim()) {
        setError("Registration number is required for Kampere Motari review.");
        setLoading(false);
        return;
      }
      if (!registrationFile) {
        setError("Upload your business registration document (PDF, image, DOC, or DOCX).");
        setLoading(false);
        return;
      }

      const companyPhone = form.phone.trim()
        ? normalizeRwandaPhone(form.phone) ?? undefined
        : undefined;
      const adminPhone = normalizeRwandaPhone(admin.phone);
      if (!adminPhone) {
        setError("Your phone on the previous step is invalid. Go back and fix it.");
        setLoading(false);
        return;
      }

      const registrationUpload = await uploadCompanyDocumentFile(registrationFile);
      const documents: Array<{
        type: string;
        title: string;
        fileUrl: string;
      }> = [
        {
          type: "BUSINESS_REGISTRATION",
          title: registrationFile.name || "Business registration certificate",
          fileUrl: registrationUpload.url,
        },
      ];

      if (directorIdFile) {
        const directorUpload = await uploadCompanyDocumentFile(directorIdFile);
        documents.push({
          type: "DIRECTOR_ID",
          title: directorIdFile.name || "Director / admin ID",
          fileUrl: directorUpload.url,
        });
      }

      const result = await registerCompanyRequest({
        company: {
          name: form.name.trim() || admin.companyName,
          phone: companyPhone,
          email: form.email.trim() || admin.email,
          address: form.address.trim() || undefined,
          registrationNumber: form.registrationNumber.trim(),
          currency: form.currency,
          timezone: form.timezone,
        },
        admin: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: adminPhone,
        },
        documents,
      });

      clearAdminDraft();
      const params = new URLSearchParams({
        company: result.companyName,
        email: result.email ?? admin.email,
      });
      router.push(`/register/success?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-[var(--shadow-soft)]" padding="lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text tracking-tight">
          Company details
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Upload supporting documents so Super Admin can validate and approve your company. You will set a password after approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Company name">
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Registration number">
          <Input
            value={form.registrationNumber}
            onChange={(e) => update("registrationNumber", e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" hint="Rwanda mobile · 0788… or +250788…">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+250 788 000 000"
            />
          </Field>
          <Field label="Ops email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="ops@company.rw"
            />
          </Field>
        </div>
        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Kigali, Rwanda"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <Select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Select
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
            >
              <option value="Africa/Kigali">Africa/Kigali</option>
            </Select>
          </Field>
        </div>
        <Field label="Business registration document" hint="PDF, image, DOC, or DOCX">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*,.docx"
            onChange={(e) => setRegistrationFile(e.target.files?.[0] ?? null)}
            required
          />
        </Field>
        <Field label="Director / admin ID (optional)">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*,.docx"
            onChange={(e) => setDirectorIdFile(e.target.files?.[0] ?? null)}
          />
        </Field>

        {error ? (
          <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit waitlist application"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/register")}
          >
            Back
          </Button>
        </div>
      </form>
    </Card>
  );
}
