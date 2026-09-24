import { cn } from "@/lib/utils";

type Tone =
  | "available"
  | "busy"
  | "awaiting_availability"
  | "offline"
  | "online"
  | "reserved"
  | "searching"
  | "no_rider"
  | "assigned"
  | "to_pickup"
  | "waiting"
  | "in_progress"
  | "completed"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "overdue"
  | "maintenance"
  | "suspended"
  | "unauthorized"
  | "gps_offline"
  | "delayed"
  | "critical"
  | "warning"
  | "info"
  | "draft"
  | "on_trip";

const toneStyles: Record<Tone, string> = {
  busy: "bg-warning-soft text-warning border-amber-200",
  awaiting_availability: "bg-warning-soft text-warning border-amber-200",
  available: "bg-success-soft text-success border-green-200",
  online: "bg-success-soft text-success border-green-200",
  completed: "bg-success-soft text-success border-green-200",
  paid: "bg-success-soft text-success border-green-200",
  approved: "bg-success-soft text-success border-green-200",
  pending: "bg-warning-soft text-warning border-amber-200",
  reserved: "bg-warning-soft text-warning border-amber-200",
  waiting: "bg-warning-soft text-warning border-amber-200",
  delayed: "bg-warning-soft text-warning border-amber-200",
  unpaid: "bg-warning-soft text-warning border-amber-200",
  warning: "bg-warning-soft text-warning border-amber-200",
  searching: "bg-warning-soft text-warning border-amber-200",
  to_pickup: "bg-primary-soft text-primary border-blue-200",
  assigned: "bg-primary-soft text-primary border-blue-200",
  in_progress: "bg-primary-soft text-primary border-blue-200",
  on_trip: "bg-primary-soft text-primary border-blue-200",
  info: "bg-primary-soft text-primary border-blue-200",
  offline: "bg-slate-100 text-slate-500 border-slate-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  draft: "bg-slate-100 text-slate-500 border-slate-200",
  maintenance: "bg-slate-100 text-slate-600 border-slate-200",
  suspended: "bg-slate-100 text-slate-600 border-slate-200",
  rejected: "bg-danger-soft text-danger border-red-200",
  overdue: "bg-danger-soft text-danger border-red-200",
  unauthorized: "bg-danger-soft text-danger border-red-200",
  gps_offline: "bg-danger-soft text-danger border-red-200",
  critical: "bg-danger-soft text-danger border-red-200",
  no_rider: "bg-danger-soft text-danger border-red-200",
};

const labels: Partial<Record<Tone, string>> = {
  busy: "Busy · other passenger",
  awaiting_availability: "Confirm availability",
  available: "Available",
  offline: "Offline",
  online: "Online",
  reserved: "Reserved",
  searching: "Searching",
  no_rider: "No rider",
  assigned: "Assigned",
  to_pickup: "To Pickup",
  waiting: "Waiting",
  in_progress: "In Progress",
  on_trip: "On Trip",
  completed: "Completed",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  paid: "Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  maintenance: "Maintenance",
  suspended: "Suspended",
  unauthorized: "Unauthorized Movement",
  gps_offline: "GPS Offline",
  delayed: "Location Delayed",
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  draft: "Draft",
};

const dotColors: Record<Tone, string> = {
  busy: "bg-warning",
  awaiting_availability: "bg-warning",
  available: "bg-success",
  online: "bg-success",
  completed: "bg-success",
  paid: "bg-success",
  approved: "bg-success",
  pending: "bg-warning",
  reserved: "bg-warning",
  waiting: "bg-warning",
  delayed: "bg-warning",
  unpaid: "bg-warning",
  warning: "bg-warning",
  searching: "bg-warning",
  to_pickup: "bg-primary",
  assigned: "bg-primary",
  in_progress: "bg-primary",
  on_trip: "bg-primary",
  info: "bg-primary",
  offline: "bg-slate-400",
  cancelled: "bg-slate-400",
  draft: "bg-slate-400",
  maintenance: "bg-slate-500",
  suspended: "bg-slate-500",
  rejected: "bg-danger",
  overdue: "bg-danger",
  unauthorized: "bg-danger",
  gps_offline: "bg-danger",
  critical: "bg-danger",
  no_rider: "bg-danger",
};

interface StatusBadgeProps {
  status: Tone | string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  label,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const tone = (status in toneStyles ? status : "offline") as Tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
    >
      {showDot && (
        <span className={cn("size-1.5 rounded-full shrink-0", dotColors[tone])} />
      )}
      {label ?? labels[tone] ?? status}
    </span>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: Tone | string;
  className?: string;
}) {
  const tone = (status in toneStyles ? status : "offline") as Tone;
  return (
    <span
      className={cn("inline-block size-2 rounded-full shrink-0", dotColors[tone], className)}
      aria-hidden
    />
  );
}
