"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { company, supervisorUser, supervisors } from "@/data/mock";
import { useAppDispatch } from "@/store";
import { clearSession as clearStorage, getRefreshToken } from "@/lib/api/client";
import { logoutRequest } from "@/lib/api/auth";
import { clearSession } from "@/store/slices/auth-slice";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupervisorProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const profile = supervisors[0];

  return (
    <div className="max-w-[640px] mx-auto space-y-4">
      <PageHeader title="Profile" description="Your supervisor account." />

      <Card padding="lg">
        <div className="flex items-center gap-4">
          <Avatar initials={supervisorUser.avatarInitials} size="lg" />
          <div>
            <p className="text-lg font-semibold text-text">{supervisorUser.name}</p>
            <p className="text-sm text-text-secondary">{supervisorUser.email}</p>
            <div className="mt-2">
              <StatusBadge status="available" label="Active" />
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Phone</dt>
            <dd className="font-medium text-text">{supervisorUser.phone}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Department</dt>
            <dd className="font-medium text-text">{profile.department}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Company</dt>
            <dd className="font-medium text-text">{company.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-3">
            <dt className="text-text-muted">Employees managed</dt>
            <dd className="font-medium text-text">{profile.employeesManaged}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Last active</dt>
            <dd className="font-medium text-text">{profile.lastActive}</dd>
          </div>
        </dl>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Permissions</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {profile.permissions.map((p) => (
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
