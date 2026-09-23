"use client";

import { LiveTrackingView } from "@/components/tracking/live-tracking-view";

export default function SupervisorFleetPage() {
  return (
    <LiveTrackingView
      title="Fleet view"
      description="Live rider tracking for your company"
      linksBase="supervisor"
    />
  );
}
