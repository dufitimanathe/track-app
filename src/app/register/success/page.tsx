"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const search = useSearchParams();
  const company = search.get("company") || "Your company";
  const email = search.get("email") || "your email";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="Kampere Motari"
            width={48}
            height={48}
            className="rounded-[10px] object-cover"
            priority
          />
        </div>
        <Card padding="lg" className="space-y-4 shadow-[var(--shadow-soft)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Kampere Motari
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-text">
              You are on the waitlist
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              <strong className="text-text">{company}</strong> is waiting for Super Admin review.
              When approved, we will email <strong className="text-text">{email}</strong> with a
              link to set your password and sign in.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            No password yet — you set it after approval from the email link.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-[8px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Back to home
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-text-secondary">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
