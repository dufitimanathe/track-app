"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const STEPS = [
  { id: "account", label: "Account", href: "/register" },
  { id: "company", label: "Company", href: "/onboarding/company" },
  { id: "operations", label: "Operations", href: "/onboarding/operations" },
  { id: "fleet", label: "Fleet", href: "/onboarding/fleet" },
  { id: "team", label: "Team", href: "/onboarding/team" },
  { id: "finish", label: "Finish", href: "/onboarding/complete" },
] as const;

function stepIndex(pathname: string): number {
  if (pathname.includes("/onboarding/complete")) return 5;
  if (pathname.includes("/onboarding/team")) return 4;
  if (pathname.includes("/onboarding/fleet")) return 3;
  if (pathname.includes("/onboarding/operations")) return 2;
  if (pathname.includes("/onboarding/company")) return 1;
  return 0;
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = stepIndex(pathname);
  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-text-muted">
              FleetOps
            </p>
            <p className="text-sm font-medium text-text mt-0.5">Workspace setup</p>
          </div>
          <Link
            href="/login"
            className="text-xs font-medium text-text-secondary hover:text-primary"
          >
            Exit
          </Link>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {STEPS.map((step, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={step.id} className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-[8px] px-1.5 py-1.5 sm:px-2",
                      active && "bg-primary-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        done && "bg-success text-white",
                        active && "bg-primary text-white",
                        !done && !active && "bg-surface-muted text-text-muted",
                      )}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "truncate text-[11px] font-medium sm:text-xs",
                        active ? "text-primary" : done ? "text-text" : "text-text-muted",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
