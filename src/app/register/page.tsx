"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { saveAdminDraft } from "@/lib/onboarding-draft";
import {
  isValidEmail,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from "@/lib/validation/rwanda";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(form.email)) {
      setError("Enter a valid work email address.");
      return;
    }
    if (!isValidRwandaPhone(form.phone)) {
      setError("Phone must be a valid Rwanda mobile (e.g. 0788123456 or +250788123456).");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      setError("Password must include uppercase, lowercase, and a number.");
      return;
    }

    const phone = normalizeRwandaPhone(form.phone);
    if (!phone) {
      setError("Phone must be a valid Rwanda mobile number.");
      return;
    }

    saveAdminDraft({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone,
      password: form.password,
    });
    router.push("/onboarding/company");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <p className="text-center text-xs font-semibold tracking-[0.14em] uppercase text-text-muted mb-6">
          FleetOps
        </p>

        <Card className="shadow-[var(--shadow-soft)]" padding="lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text tracking-tight">
              Join the waitlist
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Create your account, share company details, and wait for Kampere Motari approval
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Marie"
                  required
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Uwase"
                  required
                />
              </Field>
            </div>
            <Field label="Work email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="admin@company.rw"
                required
              />
            </Field>
            <Field
              label="Phone"
              hint="Rwanda mobile · 0788… or +250788…"
            >
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+250 788 000 000"
                required
              />
            </Field>
            <Field
              label="Password"
              hint="8+ chars with upper, lower, and a number"
            >
              <PasswordInput
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>

            {error ? (
              <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">
                {error}
              </p>
            ) : null}

            <Button type="submit" fullWidth size="lg">
              Continue
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
