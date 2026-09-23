import type { UserRole } from "@/types";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bike,
  Bell,
  Building2,
  CircleDot,
  ClipboardList,
  FileText,
  History,
  Home,
  LayoutDashboard,
  Map,
  MapPinned,
  Receipt,
  Settings,
  Shield,
  Users,
  UserCircle,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "pending" | "incidents";
}

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Live Operations", href: "/admin/live", icon: MapPinned },
  { label: "Tracking History", href: "/admin/tracking/history", icon: History },
  { label: "Geofences", href: "/admin/tracking/geofences", icon: CircleDot },
  { label: "Requests", href: "/admin/requests", icon: ClipboardList, badge: "pending" },
  { label: "Trips", href: "/admin/trips", icon: Activity },
  { label: "Fleet", href: "/admin/fleet", icon: Bike },
  { label: "Riders", href: "/admin/riders", icon: Users },
  { label: "Employees", href: "/admin/employees", icon: Building2 },
  { label: "Supervisors", href: "/admin/supervisors", icon: Shield },
  { label: "Billing", href: "/admin/billing", icon: Wallet },
  { label: "Invoices", href: "/admin/invoices", icon: Receipt },
  { label: "Incidents", href: "/admin/incidents", icon: AlertTriangle, badge: "incidents" },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const supervisorNav: NavItem[] = [
  { label: "Overview", href: "/supervisor", icon: LayoutDashboard },
  { label: "Requests", href: "/supervisor/requests", icon: ClipboardList, badge: "pending" },
  { label: "Active Trips", href: "/supervisor/active-trips", icon: MapPinned },
  { label: "Trips", href: "/supervisor/trips", icon: Activity },
  { label: "Employees", href: "/supervisor/employees", icon: Building2 },
  { label: "Fleet View", href: "/supervisor/fleet", icon: Bike },
  { label: "Notifications", href: "/supervisor/notifications", icon: Bell },
  { label: "Reports", href: "/supervisor/reports", icon: FileText },
  { label: "Profile", href: "/supervisor/profile", icon: UserCircle },
];

/** Accountant: money, trips, requests — no fleet/rider/user admin. */
export const accountantNav: NavItem[] = [
  { label: "Overview", href: "/accountant", icon: LayoutDashboard },
  { label: "Requests", href: "/accountant/requests", icon: ClipboardList },
  { label: "Trips", href: "/accountant/trips", icon: Activity },
  { label: "Billing", href: "/accountant/billing", icon: Wallet },
  { label: "Invoices", href: "/accountant/invoices", icon: Receipt },
  { label: "Reports", href: "/accountant/reports", icon: FileText },
  { label: "Notifications", href: "/accountant/notifications", icon: Bell },
  { label: "Profile", href: "/accountant/profile", icon: UserCircle },
];

export const riderNav: NavItem[] = [
  { label: "Home", href: "/rider", icon: Home },
  { label: "Trips", href: "/rider/trips", icon: Activity },
  { label: "Map", href: "/rider/map", icon: Map },
  { label: "Alerts", href: "/rider/notifications", icon: Bell },
  { label: "Profile", href: "/rider/profile", icon: UserCircle },
];

export function navForRole(role: UserRole): NavItem[] {
  if (role === "SUPERVISOR") return supervisorNav;
  if (role === "ACCOUNTANT") return accountantNav;
  if (role === "RIDER") return riderNav;
  return adminNav;
}

export function homeForRole(role: UserRole): string {
  if (role === "SUPERVISOR") return "/supervisor";
  if (role === "ACCOUNTANT") return "/accountant";
  if (role === "RIDER") return "/rider";
  return "/admin";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "COMPANY_ADMIN":
      return "Company Admin";
    case "SUPERVISOR":
      return "Supervisor";
    case "ACCOUNTANT":
      return "Accountant";
    case "RIDER":
      return "Rider";
    case "EMPLOYEE":
      return "Employee";
    case "PLATFORM_ADMIN":
      return "Platform Admin";
    default:
      return role;
  }
}
