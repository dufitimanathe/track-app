import { apiFetch, apiList, type ListQuery, type PaginatedResult } from '@/lib/api/client';

export interface DashboardDto {
  activeTrips: number;
  pendingRequests: number;
  availableRiders: number;
  activeRiders: number;
  activeMotorcycles: number;
  openIncidents: number;
  membersCount: number;
  fleet: {
    totalMotorcycles: number;
    activeMotorcycles: number;
    totalRiders: number;
    availableRiders: number;
  };
  today: {
    tripsCompleted: number;
    tripsStarted: number;
    revenue: string;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    title: string;
    severity: string;
    detectedAt: string;
  }>;
}

export interface EmployeeDto {
  id: string;
  companyId: string;
  userId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  employeeCode?: string | null;
  department?: string | null;
  supervisorId?: string | null;
  canRequestTransport: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiderDto {
  id: string;
  companyId: string;
  userId: string;
  phone: string;
  licenseNumber?: string | null;
  status: string;
  availabilityStatus: string;
  currentLatitude?: string | null;
  currentLongitude?: string | null;
  locationUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface MotorcycleDto {
  id: string;
  companyId: string;
  plateNumber: string;
  internalCode?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  status: string;
  trackingStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportRequestDto {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string | null;
  employeePhone?: string | null;
  department?: string | null;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  requestedAt: string;
  requestedPickupTime: string;
  channel: string;
  status: string;
  estimatedDistanceKm?: string | null;
  estimatedDurationMinutes?: number | null;
  estimatedPrice?: string | null;
  notes?: string | null;
}

export interface TripDto {
  id: string;
  companyId: string;
  transportRequestId: string;
  employeeId: string;
  employeeName?: string | null;
  riderId?: string | null;
  riderName?: string | null;
  motorcycleId?: string | null;
  motorcyclePlate?: string | null;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  estimatedDistanceKm?: string | null;
  actualDistanceKm?: string | null;
  estimatedDurationMinutes?: number | null;
  actualDurationMinutes?: number | null;
  estimatedPrice?: string | null;
  finalPrice?: string | null;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  arrivedAtPickupAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberDto {
  id: string;
  companyId: string;
  role: string;
  status: string;
  joinedAt: string;
  temporaryPassword?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface NotificationDto {
  id: string;
  companyId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface IncidentDto {
  id: string;
  companyId: string;
  motorcycleId?: string | null;
  riderId?: string | null;
  tripId?: string | null;
  type: string;
  severity: string;
  status: string;
  title: string;
  description?: string | null;
  detectedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
}

export interface InvoiceLineDto {
  id: string;
  description: string;
  amount: string;
  currency?: string;
  tripId?: string | null;
}

export interface InvoiceDto {
  id: string;
  companyId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  subtotal: string;
  total: string;
  currency: string;
  issuedAt?: string | null;
  lines?: InvoiceLineDto[];
}

export interface AssignmentDto {
  id: string;
  companyId: string;
  riderId: string;
  motorcycleId: string;
  assignedById: string;
  assignedAt: string;
  unassignedAt?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiderMeDto extends RiderDto {
  motorcycle?: {
    id: string;
    plateNumber: string;
    internalCode?: string | null;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    color?: string | null;
    status: string;
    trackingStatus: string;
  } | null;
  assignmentId?: string | null;
}

export interface CompanyDto {
  id: string;
  name: string;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  timezone?: string;
  trackingShareIntervalMinutes?: number;
  trackingHistoryRetentionDays?: number;
  trackingKeepDailyLastPingOnly?: boolean;
}

export interface ReportSummaryDto {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: string;
  totalDistanceKm: string;
  openIncidents: number;
  averageTripDistanceKm: string;
}

export interface BillingRecordDto {
  id: string;
  companyId: string;
  tripId: string;
  employeeId: string;
  riderId: string;
  motorcycleId: string;
  distanceKm: string;
  totalAmount: string;
  currency: string;
  billingStatus: string;
  createdAt: string;
}

export function fetchDashboard(companyId: string) {
  return apiFetch<DashboardDto>(`/companies/${companyId}/dashboard`);
}

export function fetchEmployees(companyId: string, query?: ListQuery) {
  return apiList<EmployeeDto>(`/companies/${companyId}/employees`, query);
}

export function createEmployee(
  companyId: string,
  body: {
    fullName: string;
    phone: string;
    email?: string;
    employeeCode?: string;
    department?: string;
    canRequestTransport?: boolean;
  },
) {
  return apiFetch<EmployeeDto>(`/companies/${companyId}/employees`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateEmployee(
  companyId: string,
  employeeId: string,
  body: {
    fullName?: string;
    phone?: string;
    email?: string | null;
    employeeCode?: string | null;
    department?: string | null;
    canRequestTransport?: boolean;
    status?: string;
  },
) {
  return apiFetch<EmployeeDto>(`/companies/${companyId}/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deactivateEmployee(companyId: string, employeeId: string) {
  return apiFetch<EmployeeDto>(`/companies/${companyId}/employees/${employeeId}/deactivate`, {
    method: 'POST',
  });
}

export function fetchRiders(companyId: string, query?: ListQuery) {
  return apiList<RiderDto>(`/companies/${companyId}/riders`, query);
}

export function fetchMotorcycles(companyId: string, query?: ListQuery) {
  return apiList<MotorcycleDto>(`/companies/${companyId}/motorcycles`, query);
}

export function createMotorcycle(
  companyId: string,
  body: {
    plateNumber: string;
    internalCode?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
  },
) {
  return apiFetch<MotorcycleDto>(`/companies/${companyId}/motorcycles`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchTransportRequests(companyId: string, query?: ListQuery) {
  return apiList<TransportRequestDto>(`/companies/${companyId}/transport-requests`, query);
}

export function approveRequest(companyId: string, requestId: string, notes?: string) {
  return apiFetch(`/companies/${companyId}/transport-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export function rejectRequest(companyId: string, requestId: string, notes?: string) {
  return apiFetch(`/companies/${companyId}/transport-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export function fetchTrips(companyId: string, query?: ListQuery) {
  return apiList<TripDto>(`/companies/${companyId}/trips`, query);
}

export function fetchTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}`, {}, { companyId });
}

export interface AssignmentCandidateDto {
  rank: number;
  riderId: string;
  motorcycleId: string;
  riderName: string;
  riderPhone: string;
  plateNumber: string;
  distanceMeters: number;
  durationSeconds?: number;
  etaMinutes?: number;
  latitude?: number;
  longitude?: number;
  locationAgeSeconds?: number;
  recommended: boolean;
}

export interface AssignmentRecommendationsDto {
  tripId: string;
  method: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  recommendedRiderId?: string;
  candidates: AssignmentCandidateDto[];
}

export function fetchAssignmentCandidates(companyId: string, tripId: string) {
  return apiFetch<AssignmentRecommendationsDto>(
    `/companies/${companyId}/trips/${tripId}/assignment-candidates`,
    {},
    { companyId },
  );
}

export function assignTrip(
  companyId: string,
  tripId: string,
  body: { riderId: string; motorcycleId?: string; reason?: string },
) {
  return apiFetch<TripDto>(`/companies/${companyId}/trips/${tripId}/assign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function redispatchTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/companies/${companyId}/trips/${tripId}/redispatch`, {
    method: 'POST',
  });
}

export function cancelTrip(companyId: string, tripId: string, reason?: string) {
  return apiFetch<TripDto>(`/companies/${companyId}/trips/${tripId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function acceptTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}/accept`, { method: 'POST' }, { companyId });
}

export function declineTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}/decline`, { method: 'POST' }, { companyId });
}

export function arriveTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}/arrive`, { method: 'POST' }, { companyId });
}

export function startTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}/start`, { method: 'POST' }, { companyId });
}

export function completeTrip(companyId: string, tripId: string) {
  return apiFetch<TripDto>(`/trips/${tripId}/complete`, { method: 'POST' }, { companyId });
}

export function fetchMotorcycle(companyId: string, motorcycleId: string) {
  return apiFetch<MotorcycleDto>(`/companies/${companyId}/motorcycles/${motorcycleId}`);
}

export function updateMotorcycleStatus(
  companyId: string,
  motorcycleId: string,
  status: string,
) {
  return apiFetch<MotorcycleDto>(`/companies/${companyId}/motorcycles/${motorcycleId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchRider(companyId: string, riderId: string) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}`);
}

export function fetchRiderMe(companyId: string) {
  return apiFetch<RiderMeDto>(`/companies/${companyId}/riders/me`);
}

export function updateRiderAvailability(
  companyId: string,
  riderId: string,
  availabilityStatus: 'OFFLINE' | 'AVAILABLE',
) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}/availability`, {
    method: 'POST',
    body: JSON.stringify({ availabilityStatus }),
  });
}

export function updateRiderStatus(companyId: string, riderId: string, status: string) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateRider(
  companyId: string,
  riderId: string,
  body: {
    status?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    licenseNumber?: string | null;
  },
) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deactivateRider(companyId: string, riderId: string) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}/deactivate`, {
    method: 'POST',
  });
}

export function markRiderUnavailable(companyId: string, riderId: string) {
  return apiFetch<RiderDto>(`/companies/${companyId}/riders/${riderId}/unavailable`, {
    method: 'POST',
  });
}

export function deleteRider(companyId: string, riderId: string) {
  return apiFetch<{ id: string; deleted: true }>(
    `/companies/${companyId}/riders/${riderId}`,
    { method: 'DELETE' },
  );
}

export function createRider(
  companyId: string,
  body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    licenseNumber?: string;
    password?: string;
  },
) {
  return apiFetch<
    RiderDto & { temporaryPassword?: string; inviteSent?: boolean; activationToken?: string }
  >(`/companies/${companyId}/riders`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createMember(
  companyId: string,
  body: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    role: string;
    password?: string;
    status?: string;
  },
) {
  return apiFetch<MemberDto>(`/companies/${companyId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateMember(
  companyId: string,
  memberId: string,
  body: { role?: string; status?: string },
) {
  return apiFetch<MemberDto>(`/companies/${companyId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function fetchAssignments(companyId: string, query?: ListQuery) {
  return apiList<AssignmentDto>(
    `/companies/${companyId}/rider-motorcycle-assignments`,
    query,
  );
}

export function assignRiderMotorcycle(
  companyId: string,
  body: { riderId: string; motorcycleId: string },
) {
  return apiFetch<AssignmentDto>(
    `/companies/${companyId}/rider-motorcycle-assignments/assign`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function unassignRiderMotorcycle(companyId: string, assignmentId: string) {
  return apiFetch<AssignmentDto>(
    `/companies/${companyId}/rider-motorcycle-assignments/${assignmentId}/unassign`,
    { method: 'POST' },
  );
}

export function fetchInvoice(companyId: string, invoiceId: string) {
  return apiFetch<InvoiceDto>(`/companies/${companyId}/invoices/${invoiceId}`);
}

export function generateInvoice(
  companyId: string,
  body: { periodStart: string; periodEnd: string },
) {
  return apiFetch<InvoiceDto>(`/companies/${companyId}/invoices/generate`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchCompany(companyId: string) {
  return apiFetch<CompanyDto>(`/companies/${companyId}`);
}

export function updateCompany(
  companyId: string,
  body: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    trackingShareIntervalMinutes: number;
    trackingHistoryRetentionDays: number;
    trackingKeepDailyLastPingOnly: boolean;
  }>,
) {
  return apiFetch<CompanyDto>(`/companies/${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function updateOnboarding(
  companyId: string,
  body: {
    companyProfileCompleted?: boolean;
    operationalSettingsCompleted?: boolean;
    fleetAdded?: boolean;
    teamAdded?: boolean;
  },
) {
  return apiFetch(`/companies/${companyId}/onboarding`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function fetchReportSummary(
  companyId: string,
  query?: { from?: string; to?: string },
) {
  const qs = new URLSearchParams();
  if (query?.from) qs.set('from', query.from);
  if (query?.to) qs.set('to', query.to);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<ReportSummaryDto>(`/companies/${companyId}/reports/summary${suffix}`);
}

export function fetchMembers(companyId: string, query?: ListQuery) {
  return apiList<MemberDto>(`/companies/${companyId}/members`, query);
}

export function fetchNotifications(companyId: string, query?: ListQuery) {
  return apiList<NotificationDto>(
    `/companies/${companyId}/notifications`,
    query,
    { companyId },
  );
}

export function markNotificationRead(companyId: string, notificationId: string) {
  return apiFetch(
    `/companies/${companyId}/notifications/${notificationId}/read`,
    { method: 'PATCH' },
    { companyId },
  );
}

export function fetchIncidents(companyId: string, query?: ListQuery) {
  return apiList<IncidentDto>(`/companies/${companyId}/incidents`, query);
}

export function acknowledgeIncident(companyId: string, incidentId: string) {
  return apiFetch(`/companies/${companyId}/incidents/${incidentId}/acknowledge`, {
    method: 'POST',
  });
}

export function resolveIncident(companyId: string, incidentId: string) {
  return apiFetch(`/companies/${companyId}/incidents/${incidentId}/resolve`, {
    method: 'POST',
  });
}

export function fetchInvoices(companyId: string, query?: ListQuery) {
  return apiList<InvoiceDto>(`/companies/${companyId}/invoices`, query);
}

export function fetchBilling(companyId: string, query?: ListQuery) {
  return apiList<BillingRecordDto>(`/companies/${companyId}/billing`, query);
}

export type { PaginatedResult };
