import type {
  DashboardDto,
  EmployeeDto,
  IncidentDto,
  InvoiceDto,
  MemberDto,
  MotorcycleDto,
  NotificationDto,
  RiderDto,
  RiderMeDto,
  TransportRequestDto,
  TripDto,
} from '@/lib/api/resources';
import type {
  DashboardStats,
  Employee,
  Incident,
  Invoice,
  NotificationItem,
  Motorcycle,
  RequestStatus,
  Rider,
  RiderAvailability,
  Supervisor,
  TransportRequest,
  Trip,
  TripStatus,
  FleetStatus,
  GpsStatus,
} from '@/types';

function mapRequestStatus(status: string): RequestStatus {
  const s = status.toUpperCase();
  if (s.includes('PENDING')) return 'pending';
  if (s.includes('APPROVED') || s.includes('DISPATCH') || s.includes('ASSIGNED')) return 'approved';
  if (s.includes('REJECT')) return 'rejected';
  if (s.includes('CANCEL')) return 'cancelled';
  if (s.includes('COMPLETE')) return 'completed';
  return 'pending';
}

function mapTripStatus(status: string): TripStatus {
  const s = status.toUpperCase();
  if (s.includes('COMPLETE')) return 'completed';
  if (s.includes('CANCEL')) return 'cancelled';
  if (s.includes('NO_RIDER')) return 'no_rider';
  if (s.includes('IN_PROGRESS') || s.includes('STARTED')) return 'in_progress';
  if (s.includes('ARRIVED') || s.includes('WAITING')) return 'waiting';
  if (s.includes('TO_PICKUP') || s.includes('ACCEPTED')) return 'to_pickup';
  if (s.includes('SEARCH')) return 'searching';
  if (s.includes('ASSIGN')) return 'assigned';
  return 'searching';
}

function mapFleetStatus(status: string, tracking?: string): FleetStatus {
  const s = status.toUpperCase();
  const t = (tracking ?? '').toUpperCase();
  if (t.includes('UNAUTHORIZED')) return 'unauthorized';
  if (s.includes('MAINTENANCE')) return 'maintenance';
  if (s.includes('INACTIVE') || s.includes('OFFLINE')) return 'offline';
  if (t.includes('MOVING')) return 'on_trip';
  return 'available';
}

function mapGps(tracking?: string): GpsStatus {
  const t = (tracking ?? '').toUpperCase();
  if (t.includes('OFFLINE')) return 'offline';
  if (t.includes('DELAY')) return 'delayed';
  return 'online';
}

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function mapAvailability(status: string): RiderAvailability {
  const s = status.toUpperCase();
  if (s === 'BUSY') return 'busy';
  if (s === 'AWAITING_AVAILABILITY') return 'awaiting_availability';
  if (s.includes('OFFLINE')) return 'offline';
  if (s.includes('SUSPEND')) return 'suspended';
  if (s.includes('ON_TRIP')) return 'on_trip';
  if (s.includes('WAITING')) return 'waiting';
  if (s.includes('TO_PICKUP')) return 'to_pickup';
  if (s.includes('ASSIGN')) return 'assigned';
  if (s.includes('RESERVED')) return 'reserved';
  return 'available';
}

export function mapDashboard(dto: DashboardDto): DashboardStats {
  return {
    activeTrips: dto.activeTrips,
    availableRiders: dto.availableRiders,
    totalRiders: dto.fleet.totalRiders,
    pendingRequests: dto.pendingRequests,
    motorcyclesOnline: dto.activeMotorcycles,
    totalMotorcycles: dto.fleet.totalMotorcycles,
    tripsToday: dto.today.tripsStarted,
    completedToday: dto.today.tripsCompleted,
    distanceTodayKm: 0,
    transportCostToday: Number(dto.today.revenue) || 0,
    employeesCount: dto.employeesCount,
    billingTotal: Number(dto.billingTotal) || 0,
    companyType: dto.companyType,
  };
}

export function mapEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    name: dto.fullName,
    phone: dto.phone,
    email: dto.email ?? '',
    department: dto.department ?? '—',
    employeeId: dto.employeeCode ?? dto.id.slice(0, 8),
    status: dto.status.toUpperCase() === 'ACTIVE' ? 'active' : 'inactive',
    tripsThisMonth: 0,
    transportCost: 0,
    lastRequest: formatWhen(dto.updatedAt),
  };
}

export function mapMotorcycle(dto: MotorcycleDto): Motorcycle {
  return {
    id: dto.id,
    plate: dto.plateNumber,
    fleetNumber: dto.internalCode ?? dto.plateNumber,
    brand: dto.brand ?? '—',
    model: dto.model ?? '—',
    year: dto.year ?? 0,
    color: dto.color ?? '—',
    status: mapFleetStatus(dto.status, dto.trackingStatus),
    gpsStatus: mapGps(dto.trackingStatus),
    location: '—',
    lat: -1.9441,
    lng: 30.0619,
    speed: 0,
    tripsToday: 0,
    distanceTodayKm: 0,
    lastSeen: formatWhen(dto.updatedAt),
  };
}

export function mapRider(dto: RiderDto): Rider {
  const name = [dto.firstName, dto.lastName].filter(Boolean).join(' ') || 'Rider';
  const lat = dto.currentLatitude != null ? Number(dto.currentLatitude) : null;
  const lng = dto.currentLongitude != null ? Number(dto.currentLongitude) : null;
  return {
    id: dto.id,
    name,
    phone: dto.phone,
    availability: mapAvailability(dto.availabilityStatus),
    location:
      lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
        ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : 'No fix',
    tripsToday: 0,
    rating: 0,
    lastActive: formatWhen(dto.locationUpdatedAt ?? dto.updatedAt),
    gpsStatus:
      dto.locationUpdatedAt &&
      Date.now() - new Date(dto.locationUpdatedAt).getTime() < 5 * 60_000
        ? 'online'
        : 'offline',
  };
}

export function mapRiderMeMotorcycle(dto: RiderMeDto): Motorcycle | null {
  if (!dto.motorcycle) return null;
  const lat = dto.currentLatitude != null ? Number(dto.currentLatitude) : -1.9441;
  const lng = dto.currentLongitude != null ? Number(dto.currentLongitude) : 30.0619;
  return {
    id: dto.motorcycle.id,
    plate: dto.motorcycle.plateNumber,
    fleetNumber: dto.motorcycle.internalCode ?? dto.motorcycle.plateNumber,
    brand: dto.motorcycle.brand ?? '—',
    model: dto.motorcycle.model ?? '—',
    year: dto.motorcycle.year ?? 0,
    color: dto.motorcycle.color ?? '—',
    status: mapFleetStatus(dto.motorcycle.status, dto.motorcycle.trackingStatus),
    gpsStatus: mapGps(dto.motorcycle.trackingStatus),
    riderId: dto.id,
    riderName: [dto.firstName, dto.lastName].filter(Boolean).join(' ') || 'You',
    location:
      dto.currentLatitude != null && dto.currentLongitude != null
        ? `${Number(dto.currentLatitude).toFixed(4)}, ${Number(dto.currentLongitude).toFixed(4)}`
        : 'No fix',
    lat: Number.isNaN(lat) ? -1.9441 : lat,
    lng: Number.isNaN(lng) ? 30.0619 : lng,
    speed: 0,
    tripsToday: 0,
    distanceTodayKm: 0,
    lastSeen: formatWhen(dto.locationUpdatedAt ?? dto.updatedAt),
  };
}

export function mapTransportRequest(dto: TransportRequestDto): TransportRequest {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName ?? 'Employee',
    employeePhone: dto.employeePhone ?? '',
    pickup: dto.pickupAddress,
    destination: dto.destinationAddress,
    requestedAt: formatWhen(dto.requestedAt),
    requestedTime: formatWhen(dto.requestedPickupTime),
    createdAt: formatWhen(dto.requestedAt),
    status: mapRequestStatus(dto.status),
    department: dto.department ?? undefined,
    channel:
      dto.channel?.toLowerCase() === 'whatsapp'
        ? 'whatsapp'
        : dto.channel?.toLowerCase() === 'admin'
          ? 'admin'
          : 'web',
    estimatedDistanceKm: Number(dto.estimatedDistanceKm ?? 0),
    estimatedCost: Number(dto.estimatedPrice ?? 0),
    notes: dto.notes ?? undefined,
  };
}

export function mapTrip(dto: TripDto): Trip {
  return {
    id: dto.id,
    requestId: dto.transportRequestId,
    employeeName: dto.employeeName ?? 'Employee',
    riderName: dto.riderName ?? 'Unassigned',
    motorcyclePlate: dto.motorcyclePlate ?? '—',
    pickup: dto.pickupAddress,
    destination: dto.destinationAddress,
    status: mapTripStatus(dto.status),
    startedAt: dto.startedAt ? formatWhen(dto.startedAt) : undefined,
    completedAt: dto.completedAt ? formatWhen(dto.completedAt) : undefined,
    distanceKm: Number(dto.actualDistanceKm ?? dto.estimatedDistanceKm ?? 0),
    cost: Number(dto.finalPrice ?? dto.estimatedPrice ?? 0),
    durationMin: dto.actualDurationMinutes ?? dto.estimatedDurationMinutes ?? undefined,
    etaMin: dto.estimatedDurationMinutes ?? undefined,
    requestedAt: formatWhen(dto.createdAt),
    assignedAt: dto.assignedAt ? formatWhen(dto.assignedAt) : undefined,
    pickupAt: dto.arrivedAtPickupAt ? formatWhen(dto.arrivedAtPickupAt) : undefined,
  };
}

export function mapMemberToSupervisor(dto: MemberDto): Supervisor {
  return {
    id: dto.id,
    name: `${dto.user.firstName} ${dto.user.lastName}`,
    phone: dto.user.phone ?? '',
    email: dto.user.email ?? '',
    department: dto.role,
    employeesManaged: 0,
    pendingRequests: 0,
    status: dto.status.toUpperCase() === 'ACTIVE' ? 'active' : 'inactive',
    lastActive: formatWhen(dto.joinedAt),
    permissions: [dto.role],
  };
}

export function mapNotification(dto: NotificationDto): NotificationItem {
  return {
    id: dto.id,
    category: 'system',
    title: dto.title,
    description: dto.message,
    relatedEntity: dto.relatedEntityId ?? undefined,
    timestamp: formatWhen(dto.createdAt),
    read: Boolean(dto.readAt),
    critical: dto.type?.toUpperCase().includes('INCIDENT'),
  };
}

export function mapIncident(dto: IncidentDto): Incident {
  const severity = dto.severity.toUpperCase();
  return {
    id: dto.id,
    type: dto.type,
    severity:
      severity.includes('CRIT') || severity.includes('HIGH')
        ? 'critical'
        : severity.includes('WARN') || severity.includes('MED')
          ? 'warning'
          : severity.includes('RESOLVE')
            ? 'resolved'
            : 'info',
    motorcyclePlate: dto.motorcycleId?.slice(0, 8) ?? '—',
    riderName: dto.riderId?.slice(0, 8) ?? '—',
    location: '—',
    detectedAt: formatWhen(dto.detectedAt),
    duration: '—',
    status:
      dto.status.toUpperCase() === 'RESOLVED'
        ? 'resolved'
        : dto.status.toUpperCase() === 'ACKNOWLEDGED'
          ? 'acknowledged'
          : 'open',
    description: dto.description ?? dto.title,
  };
}

export function mapInvoice(dto: InvoiceDto): Invoice {
  const s = dto.status.toUpperCase();
  return {
    id: dto.id,
    number: dto.invoiceNumber,
    period: `${formatWhen(dto.periodStart)} – ${formatWhen(dto.periodEnd)}`,
    trips: dto.lines?.length ?? 0,
    amount: Number(dto.total),
    issuedDate: formatWhen(dto.issuedAt ?? dto.periodStart),
    dueDate: formatWhen(dto.periodEnd),
    status: s.includes('PAID')
      ? 'paid'
      : s.includes('OVER')
        ? 'overdue'
        : s.includes('PEND')
          ? 'pending'
          : 'draft',
  };
}
