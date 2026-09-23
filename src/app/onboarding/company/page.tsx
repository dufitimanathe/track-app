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
import { updateOnboarding } from "@/lib/api/resources";
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
    currency: "RWF",
    timezone: "Africa/Kigali",
  });
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

      const companyPhone = form.phone.trim()
        ? normalizeRwandaPhone(form.phone) ?? undefined
        : undefined;
      const adminPhone = admin.phone
        ? normalizeRwandaPhone(admin.phone) ?? undefined
        : undefined;

      const auth = await registerCompanyRequest({
        company: {
          name: form.name.trim(),
          phone: companyPhone,
          email: form.email.trim() || undefined,
          address: form.address.trim() || undefined,
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
          membershipId: membership.id,
        }),
      );

      await updateOnboarding(membership.companyId, {
        companyProfileCompleted: true,
      });

      clearAdminDraft();
      router.push("/onboarding/operations");
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
          This creates your FleetOps workspace and admin account.
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
            {loading ? "Creating…" : "Create company"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
