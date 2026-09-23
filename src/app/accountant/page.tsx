"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, MetricCard } from "@/components/ui/card";
import { fetchDashboard } from "@/lib/api/resources";
import { mapDashboard } from "@/lib/api/mappers";
import { useAppSelector } from "@/store";
import { Activity, ClipboardList, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountantHomePage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [pending, setPending] = useState(0);
  const [trips, setTrips] = useState(0);
  const [cost, setCost] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    void fetchDashboard(companyId)
      .then((dto) => {
        const stats = mapDashboard(dto);
        setPending(stats.pendingRequests);
        setTrips(stats.tripsToday);
        setCost(stats.transportCostToday);
      })
      .catch(() => undefined);
  }, [companyId]);

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <PageHeader
        title="Finance overview"
        description="Trips, requests, billing, and invoices for your company"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Pending requests" value={pending} icon={<ClipboardList className="size-4" />} />
        <MetricCard label="Trips today" value={trips} icon={<Activity className="size-4" />} />
        <MetricCard label="Cost today (RWF)" value={Math.round(cost)} icon={<Wallet className="size-4" />} />
      </div>
      <Card className="space-y-2">
        <p className="text-sm font-semibold text-text">Shortcuts</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="text-primary underline-offset-2 hover:underline" href="/accountant/billing">
            Billing
          </Link>
          <Link className="text-primary underline-offset-2 hover:underline" href="/accountant/invoices">
            Invoices
          </Link>
          <Link className="text-primary underline-offset-2 hover:underline" href="/accountant/trips">
            Trips
          </Link>
          <Link className="text-primary underline-offset-2 hover:underline" href="/accountant/requests">
            Requests
          </Link>
        </div>
      </Card>
    </div>
  );
}
