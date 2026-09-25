import { apiFetch, clearSession, setRememberMe, setStoredCompanyId, setTokens } from '@/lib/api/client';
import { refreshTokens as refreshTokensRaw } from '@/lib/api/auth-refresh';
import type { UserRole } from '@/types';

export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  companyStatus?: string;
  companyType?: 'OPERATOR' | 'CLIENT';
  role: UserRole;
  status: string;
  joinedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: BackendUser;
}

export interface MeResponse {
  user: BackendUser;
  memberships: Membership[];
  operatorCompanyId?: string | null;
}

export async function registerCompanyRequest(input: {
  company: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
    timezone?: string;
    currency?: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
  };
  documents?: Array<{
    type: string;
    title: string;
    fileUrl: string;
    notes?: string;
  }>;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(
    '/auth/register-company',
    { method: 'POST', body: JSON.stringify(input) },
    { skipAuth: true },
  );
}

export async function loginRequest(input: {
  email?: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    { skipAuth: true },
  );
}

export async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me');
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  return refreshTokensRaw(refreshToken);
}

export async function activateAccountRequest(input: {
  token: string;
  password: string;
}): Promise<{ message: string; email?: string | null }> {
  return apiFetch(
    '/auth/activate',
    { method: 'POST', body: JSON.stringify(input) },
    { skipAuth: true },
  );
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearSession();
  }
}

export function persistAuth(
  auth: AuthTokens,
  companyId?: string | null,
  rememberMe = true,
): void {
  setRememberMe(rememberMe);
  setTokens(auth.accessToken, auth.refreshToken);
  if (companyId) setStoredCompanyId(companyId);
}

export function pickMembership(memberships: Membership[]): Membership | null {
  const active = memberships.filter((m) => m.status === 'ACTIVE');
  const preferred =
    active.find((m) => m.role === 'PLATFORM_ADMIN') ??
    active.find((m) => m.role === 'COMPANY_ADMIN') ??
    active.find((m) => m.role === 'SUPERVISOR') ??
    active.find((m) => m.role === 'ACCOUNTANT') ??
    active.find((m) => m.role === 'RIDER') ??
    active[0];
  return preferred ?? null;
}

export function displayName(user: BackendUser): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function initialsOf(user: BackendUser): string {
  return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

export function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'CO';
}
