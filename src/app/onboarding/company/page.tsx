"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import {
  companyInitials,
  displayName,
  fetchMe,
  initialsOf,
  persistAuth,
  pickMembership,
  registerCompanyRequest,
} from "@/lib/api/auth";
import { uploadCompanyDocumentFile } from "@/lib/api/uploads";
import { clearAdminDraft, loadAdminDraft } from "@/lib/onboarding-draft";
import {
  isValidEmail,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from "@/lib/validation/rwanda";
import { useAppDispatch } from "@/store";
import { setSession } from "@/store/slices/auth-slice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
    if (!loadAdminDraft()) {
      router.replace("/register");
    }
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
      if (admin.phone && !isValidRwandaPhone(admin.phone)) {
        setError("Admin phone on your account draft is invalid. Go back and fix it.");
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
      const adminPhone = admin.phone
        ? normalizeRwandaPhone(admin.phone) ?? undefined
        : undefined;

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

      const auth = await registerCompanyRequest({
        company: {
          name: form.name.trim(),
          phone: companyPhone,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
          registrationNumber: form.registrationNumber.trim(),
          currency: form.currency,
          timezone: form.timezone,
        },
        admin: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email || undefined,
          phone: adminPhone,
          password: admin.password,
        },
        documents,
      });

      persistAuth(auth);
      const me = await fetchMe();
      const membership = pickMembership(me.memberships);
      if (!membership) {
        throw new Error("Company created but no membership returned.");
      }
      persistAuth(auth, membership.companyId);
      dispatch(
        setSession({
          userId: me.user.id,
          userName: displayName(me.user),
          userEmail: me.user.email ?? admin.email,
          avatarInitials: initialsOf(me.user),
          role: membership.role,
          companyId: membership.companyId,
          companyName: membership.companyName,
          companyInitials: companyInitials(membership.companyName),
          companyStatus: membership.companyStatus ?? "PENDING_REVIEW",
          membershipId: membership.id,
        }),
      );

      clearAdminDraft();
      router.push("/onboarding/pending");
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
          Join the Kampere Motari waitlist. Upload supporting documents so Super Admin can validate and approve your company.
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
              required
            />
          </Field>
          <Field label="Ops email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            required
          />
        </Field>
        <Field
          label="Business registration document"
          hint="PDF, image, DOC, or DOCX · max 10 MB"
        >
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setRegistrationFile(e.target.files?.[0] ?? null)}
            required
          />
          {registrationFile ? (
            <p className="text-xs text-text-muted mt-1">{registrationFile.name}</p>
          ) : null}
        </Field>
        <Field label="Director ID document (optional)" hint="PDF, image, DOC, or DOCX · max 10 MB">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setDirectorIdFile(e.target.files?.[0] ?? null)}
          />
          {directorIdFile ? (
            <p className="text-xs text-text-muted mt-1">{directorIdFile.name}</p>
          ) : null}
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <Select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              <option value="RWF">RWF</option>
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

        {error ? (
          <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/register")}
          >
            Back
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading & submitting…" : "Submit for approval"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
