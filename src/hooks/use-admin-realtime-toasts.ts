"use client";

import { useToast } from "@/components/ui/toast";
import { getAccessToken } from "@/lib/api/client";
import { appConfig } from "@/lib/config";
import { useAppSelector } from "@/store";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

interface TransportRequestPayload {
  id?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  status?: string;
}

interface NotificationPayload {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  relatedEntityId?: string;
}

/**
 * Live admin toasts for approval-needed requests and inbox notifications.
 */
export function useAdminRealtimeToasts(enabled: boolean) {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const userId = useAppSelector((s) => s.auth.userId);
  const { pushToast } = useToast();
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !companyId) return;
    const token = getAccessToken();
    if (!token) return;

    let socket: Socket | null = null;
    try {
      socket = io(appConfig.wsUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      socket.on("connect", () => {
        socket?.emit("joinCompany", { companyId });
      });

      socket.on("transport_request.created", (payload: TransportRequestPayload) => {
        const key = `req:${payload.id ?? payload.pickupAddress}:${payload.status}`;
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        const needsApproval = (payload.status ?? "").toUpperCase().includes("PENDING");
        pushToast({
          title: needsApproval ? "Approval needed" : "New transport request",
          description: `${payload.pickupAddress ?? "Pickup"} → ${payload.destinationAddress ?? "Destination"}`,
          tone: "warning",
          href: "/admin/requests",
        });
      });

      socket.on("notification.created", (payload: NotificationPayload) => {
        if (!userId) return;
        const key = `notif:${payload.id ?? payload.title}:${payload.message}`;
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        const isRequest = (payload.type ?? "").toUpperCase().includes("TRANSPORT");
        pushToast({
          title: payload.title ?? "Notification",
          description: payload.message,
          tone: isRequest ? "warning" : "info",
          href: isRequest ? "/admin/requests" : "/admin/notifications",
        });
      });
    } catch {
      // optional realtime
    }

    return () => {
      socket?.disconnect();
    };
  }, [enabled, companyId, userId, pushToast]);
}
