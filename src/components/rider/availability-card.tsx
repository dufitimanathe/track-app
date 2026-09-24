"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fetchRiderMe,
  updateRiderAvailability,
  type RiderDto,
} from "@/lib/api/resources";

export function RiderAvailabilityCard({
  companyId,
  riderId,
  status,
  hasMotorcycle,
  onUpdated,
}: {
  companyId: string;
  riderId: string;
  status: string;
  hasMotorcycle: boolean;
  onUpdated: (rider: RiderDto) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const ready = status === "AVAILABLE";
  const busy = status === "BUSY";
  const needsConfirmation = status === "AWAITING_AVAILABILITY";
  const locked = ![
    "AVAILABLE",
    "BUSY",
    "AWAITING_AVAILABILITY",
    "OFFLINE",
  ].includes(status);

  async function update(next: "AVAILABLE" | "BUSY" | "OFFLINE") {
    if (pending.current || locked) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      onUpdated(await updateRiderAvailability(companyId, riderId, next));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update availability. Please try again.",
      );
      // Recover the actual status if an assignment or a network interruption raced this tap.
      try {
        onUpdated(await fetchRiderMe(companyId));
      } catch {
        /* Keep the error and allow retry. */
      }
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Card
      padding="md"
      className={needsConfirmation ? "border-green-200 bg-success-soft" : ""}
    >
      <h2 className="text-base font-semibold text-text" aria-live="polite">
        {locked
          ? "You have an active assignment"
          : needsConfirmation
            ? "Trip completed. Ready for another?"
            : ready
              ? "You’re ready for new rides"
              : busy
                ? "Busy with another passenger"
                : "Ready to start riding?"}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        {locked
          ? "Finish your assigned trip before changing availability."
          : ready
            ? "Dispatch can now assign you a ride. Picked up someone else? Tap Busy below."
            : busy
              ? "New assignments are paused. When you finish, tap Ready below."
              : "Let dispatch know you’re free. No new ride will be assigned until you tap Ready."}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {!hasMotorcycle && (
        <p className="mt-2 text-xs text-text-secondary">
          Ask your admin to assign a motorcycle before going ready.
        </p>
      )}
      {!locked && (
        <div className="mt-4 space-y-2">
          <Button
            size="lg"
            fullWidth
            disabled={saving || ready || !hasMotorcycle}
            onClick={() => void update("AVAILABLE")}
          >
            {saving ? "Updating…" : "Ready for another ride"}
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            disabled={saving || busy}
            onClick={() => void update("BUSY")}
          >
            Busy with another passenger
          </Button>
          {status !== "OFFLINE" && (
            <Button
              fullWidth
              variant="ghost"
              disabled={saving}
              onClick={() => void update("OFFLINE")}
            >
              Finish for today
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
