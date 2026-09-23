"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <p className="text-center text-xs font-semibold tracking-[0.14em] uppercase text-text-muted mb-6">
          FleetOps
        </p>

        <Card className="shadow-[var(--shadow-soft)]" padding="lg">
          {sent ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[12px] bg-success-soft text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="text-xl font-semibold text-text tracking-tight">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                If an account exists for{" "}
                <span className="font-medium text-text">{email}</span>, we sent
                reset instructions.
              </p>
              <Link href="/login" className="mt-6 inline-block">
                <Button fullWidth>Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-text tracking-tight">
                  Reset password
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Enter your work email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.rw"
                    required
                  />
                </Field>
                <Button type="submit" fullWidth size="lg">
                  Send reset link
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-text-secondary">
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
