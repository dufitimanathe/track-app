import { apiFetch, apiList, type ListQuery } from '@/lib/api/client';

export type CompanyStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'INACTIVE'
  | 'REJECTED';

export type CompanyDocumentType =
  | 'BUSINESS_REGISTRATION'
  | 'TAX_CLEARANCE'
  | 'DIRECTOR_ID'
  | 'OTHER';

export type CompanyDocumentStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface PlatformOverview {
  totalCompanies: number;
  pendingReview: number;
  activeCompanies: number;
  suspendedCompanies: number;
  rejectedCompanies: number;
  pendingDocuments: number;
}

export interface PlatformCompany {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  registrationNumber?: string | null;
  status: CompanyStatus;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  adminCount?: number;
  documentCount?: number;
  pendingDocumentCount?: number;
}

export interface PlatformDocument {
  id: string;
  companyId: string;
  type: CompanyDocumentType;
  title: string;
  fileUrl: string;
  notes?: string | null;
  status: CompanyDocumentStatus;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface PlatformAdmin {
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
    status: string;
  };
}

export interface PlatformCompanyDetail {
  company: PlatformCompany;
  documents: PlatformDocument[];
  admins: PlatformAdmin[];
}

export function fetchPlatformOverview() {
  return apiFetch<PlatformOverview>('/platform/overview');
}

export function fetchPlatformCompanies(query?: ListQuery & { status?: CompanyStatus }) {
  return apiList<PlatformCompany>('/platform/companies', query);
}

export function fetchPlatformCompany(companyId: string) {
  return apiFetch<PlatformCompanyDetail>(`/platform/companies/${companyId}`);
}

export function createPlatformCompany(body: {
  company: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  activateImmediately?: boolean;
}) {
  return apiFetch<PlatformCompanyDetail>('/platform/companies', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function approvePlatformCompany(companyId: string, notes?: string) {
  return apiFetch<PlatformCompany>(`/platform/companies/${companyId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export function rejectPlatformCompany(companyId: string, reason: string) {
  return apiFetch<PlatformCompany>(`/platform/companies/${companyId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function suspendPlatformCompany(companyId: string, notes?: string) {
  return apiFetch<PlatformCompany>(`/platform/companies/${companyId}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export function reactivatePlatformCompany(companyId: string) {
  return apiFetch<PlatformCompany>(`/platform/companies/${companyId}/reactivate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function createPlatformCompanyAdmin(
  companyId: string,
  body: { firstName: string; lastName: string; email: string; phone?: string },
) {
  return apiFetch<PlatformAdmin>(`/platform/companies/${companyId}/admins`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updatePlatformCompanyAdmin(
  companyId: string,
  memberId: string,
  body: { status?: string },
) {
  return apiFetch<PlatformAdmin>(`/platform/companies/${companyId}/admins/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function addPlatformCompanyDocument(
  companyId: string,
  body: {
    type: CompanyDocumentType;
    title: string;
    fileUrl: string;
    notes?: string;
  },
) {
  return apiFetch<PlatformDocument>(`/platform/companies/${companyId}/documents`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function reviewPlatformCompanyDocument(
  companyId: string,
  documentId: string,
  body: { status: 'APPROVED' | 'REJECTED'; notes?: string },
) {
  return apiFetch<PlatformDocument>(
    `/platform/companies/${companyId}/documents/${documentId}/review`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}
