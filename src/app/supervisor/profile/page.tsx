"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { clearSession as clearStorage, getRefreshToken } from "@/lib/api/client";
import { logoutRequest } from "@/lib/api/auth";
import { roleLabel } from "@/lib/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearSession } from "@/store/slices/auth-slice";
import type { UserRole } from "@/types";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const VIEWING_BY_ROLE: Partial<Record<UserRole, string[]>> = {
  SUPERVISOR: [
    "Approve & reject transport requests",
    "Assign / reassign riders on trips",
    "View live fleet & active trips",
    "View employees (read-only)",
    "View trip history & reports",
    "Receive ops notifications",
  ],
  ACCOUNTANT: [
    "View transport requests",
    "View trips & costs",
    "View billing & invoices",
    "View reports",
    "Receive finance notifications",
  ],
};

export default function OpsProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    userName,
    userEmail,
    avatarInitials,
    companyName,
    role,
    membershipId,
  } = useAppSelector((s) => s.auth);

  const viewing = VIEWING_BY_ROLE[role] ?? [`${roleLabel(role)} access`];
  const title =
    role === "ACCOUNTANT" ? "Accountant profile" : role === "SUPERVISOR" ? "Supervisor profile" : "Profile";

  return (
    <div className="max-w-[640px] mx-auto space-y-4">
      <PageHeader title="Profile" description={`Your ${roleLabel(role).toLowerCase()} account.`} />

      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Avatar initials={avatarInitials || "OP"} size="lg" />
          <div>
            <p className="text-lg font-semibold text-text">{userName || title}</p>
            <p className="text-sm text-text-secondary">{userEmail || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status="available" label="Active" />
              <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
                {roleLabel(role)}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Company</dt>
            <dd className="font-medium text-text text-right">{companyName || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Role</dt>
            <dd className="font-medium text-text">{roleLabel(role)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Membership</dt>
            <dd className="font-medium text-text font-mono text-xs truncate max-w-[220px]">
              {membershipId || "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Viewing & actions</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {viewing.map((p) => (
            <li
              key={p}
              className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary"
            >
              {p}
            </li>
          ))}
        </ul>
      </Card>

      <Button
        variant="danger-outline"
        fullWidth
        leftIcon={<LogOut className="size-4" />}
        onClick={() => {
          const refresh = getRefreshToken();
          void (async () => {
            if (refresh) await logoutRequest(refresh).catch(() => clearStorage());
            else clearStorage();
            dispatch(clearSession());
            router.push("/login");
          })();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
