"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { homeForRole } from "@/lib/navigation";
import { useAppSelector } from "@/store";
import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAppSelector((s) => s.auth);

  return (
    <Card className="shadow-[var(--shadow-soft)] text-center" padding="lg">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[14px] bg-success-soft text-success">
        <CheckCircle2 className="size-7" />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight">
        Workspace ready
      </h1>
      <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
        {isAuthenticated
          ? "Your company is connected to the API. Open the admin console to manage fleet, riders, and trips."
          : "Sign in with your new admin account to open the live console."}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Button
          onClick={() =>
            router.push(isAuthenticated ? homeForRole(role) : "/login")
          }
        >
          <LayoutDashboard className="size-4" />
          {isAuthenticated ? "Open dashboard" : "Go to login"}
        </Button>
      </div>
    </Card>
  );
}
