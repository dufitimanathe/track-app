export type UserRole =
  | "COMPANY_ADMIN"
  | "SUPERVISOR"
  | "ACCOUNTANT"
  | "RIDER"
  | "EMPLOYEE"
  | "PLATFORM_ADMIN";

export type FleetStatus =
  | "available"
  | "assigned"
  | "on_trip"
  | "offline"
  | "maintenance"
  | "unauthorized";

export type GpsStatus = "online" | "delayed" | "offline";

export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "assigned"
  | "completed";

export type TripStatus =
  | "searching"
  | "no_rider"
  | "assigned"
  | "to_pickup"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RiderAvailability =
  | "offline"
  | "available"
  | "busy"
  | "awaiting_availability"
  | "reserved"
  | "assigned"
  | "to_pickup"
  | "waiting"
  | "on_trip"
  | "suspended";

export type IncidentSeverity = "critical" | "warning" | "info" | "resolved";

export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue";

export interface Company {
  id: string;
  name: string;
  logoInitials: string;
  phone: string;
  email: string;
  address: string;
  currency: "RWF";
  timezone: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials: string;
  companyId: string;
}

export type MapStatus =
  | "moving"
  | "stopped"
  | "delayed"
  | "offline"
  | "poor_gps"
  | "gps_excellent"
  | "gps_acceptable"
  | "gps_poor"
  | "gps_very_poor"
  | "stale";

export interface Motorcycle {
  id: string;
  plate: string;
  fleetNumber: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: FleetStatus;
  gpsStatus: GpsStatus;
  riderId?: string;
  riderName?: string;
  location: string;
  lat: number;
  lng: number;
  speed: number;
  tripsToday: number;
  distanceTodayKm: number;
  lastSeen: string;
  heading?: number;
  /** Optional live-tracking marker variant (preferred over status for map pins). */
  mapStatus?: MapStatus;
  /** Reported GPS accuracy radius in meters (live map circle). */
  accuracyMeters?: number | null;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  availability: RiderAvailability;
  motorcycleId?: string;
  motorcyclePlate?: string;
  location: string;
  tripsToday: number;
  rating: number;
  lastActive: string;
  gpsStatus: GpsStatus;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  employeeId: string;
  status: "active" | "inactive";
  tripsThisMonth: number;
  transportCost: number;
  lastRequest: string;
}

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  employeesManaged: number;
  pendingRequests: number;
  status: "active" | "inactive";
  lastActive: string;
  permissions: string[];
}

export interface TransportRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  pickup: string;
  destination: string;
  requestedAt: string;
  requestedTime: string;
  createdAt: string;
  status: RequestStatus;
  department?: string;
  channel: "web" | "whatsapp" | "admin";
  estimatedDistanceKm: number;
  estimatedCost: number;
  assignedRider?: string;
  notes?: string;
  aiAssisted?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Trip {
  id: string;
  requestId?: string;
  employeeName: string;
  employeePhone?: string;
  riderName: string;
  motorcyclePlate: string;
  pickup: string;
  destination: string;
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  distanceKm: number;
  cost: number;
  durationMin?: number;
  currentSpeed?: number;
  etaMin?: number;
  requestedAt?: string;
  assignedAt?: string;
  pickupAt?: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  motorcyclePlate: string;
  riderName: string;
  location: string;
  detectedAt: string;
  duration: string;
  status: "open" | "acknowledged" | "resolved";
  description: string;
  distanceTravelledKm?: number;
  currentSpeed?: number;
}

export interface Invoice {
  id: string;
  number: string;
  period: string;
  trips: number;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export interface NotificationItem {
  id: string;
  category:
    | "request"
    | "approval"
    | "trip"
    | "rider"
    | "fleet"
    | "gps"
    | "incident"
    | "billing"
    | "system";
  title: string;
  description: string;
  relatedEntity?: string;
  timestamp: string;
  read: boolean;
  critical?: boolean;
}

export interface AlertItem {
  id: string;
  type: "incident" | "gps" | "request" | "trip";
  title: string;
  subtitle: string;
  meta: string;
  severity: "critical" | "warning" | "info";
  actionLabel: string;
}

export interface DashboardStats {
  activeTrips: number;
  availableRiders: number;
  totalRiders: number;
  pendingRequests: number;
  motorcyclesOnline: number;
  totalMotorcycles: number;
  tripsToday: number;
  completedToday: number;
  distanceTodayKm: number;
  transportCostToday: number;
}
