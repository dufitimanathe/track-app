import { appConfig, withNgrokSkipBrowserWarning } from '@/lib/config';
import { refreshTokens } from '@/lib/api/auth-refresh';
import { isPublicRoute } from '@/lib/public-routes';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
  error?: { code?: string; message?: string };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

const ACCESS_KEY = 'fleetops_access_token';
const REFRESH_KEY = 'fleetops_refresh_token';
const COMPANY_KEY = 'fleetops_company_id';
const REMEMBER_KEY = 'fleetops_remember_me';

function storageForRemember(): Storage | null {
  if (typeof window === 'undefined') return null;
  return isRememberMeEnabled() ? window.localStorage : window.sessionStorage;
}

export function isRememberMeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== '0';
}

export function setRememberMe(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMEMBER_KEY, enabled ? '1' : '0');
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem(ACCESS_KEY) ?? window.sessionStorage.getItem(ACCESS_KEY)
  );
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem(REFRESH_KEY) ?? window.sessionStorage.getItem(REFRESH_KEY)
  );
}

export function getStoredCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem(COMPANY_KEY) ?? window.sessionStorage.getItem(COMPANY_KEY)
  );
}

export function setStoredCompanyId(companyId: string | null): void {
  if (typeof window === 'undefined') return;
  const primary = storageForRemember();
  const secondary =
    primary === window.localStorage ? window.sessionStorage : window.localStorage;
  if (!primary) return;
  if (companyId) {
    primary.setItem(COMPANY_KEY, companyId);
    secondary.removeItem(COMPANY_KEY);
  } else {
    window.localStorage.removeItem(COMPANY_KEY);
    window.sessionStorage.removeItem(COMPANY_KEY);
  }
}

export function setTokens(access: string | null, refresh?: string | null): void {
  if (typeof window === 'undefined') return;
  const primary = storageForRemember();
  const secondary =
    primary === window.localStorage ? window.sessionStorage : window.localStorage;
  if (!primary) return;

  if (access) {
    primary.setItem(ACCESS_KEY, access);
    secondary.removeItem(ACCESS_KEY);
  } else {
    window.localStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(ACCESS_KEY);
  }

  if (refresh === undefined) return;
  if (refresh) {
    primary.setItem(REFRESH_KEY, refresh);
    secondary.removeItem(REFRESH_KEY);
  } else {
    window.localStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  }
}

/** @deprecated use setTokens */
export function setAccessToken(token: string | null): void {
  setTokens(token, token ? getRefreshToken() : null);
}

export function clearSession(): void {
  setTokens(null, null);
  setStoredCompanyId(null);
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  const path = `${window.location.pathname}${window.location.search}`;
  const pathname = window.location.pathname || '/';
  // Expired sessions must not kick users off public marketing/auth pages.
  if (isPublicRoute(pathname)) return;
  const redirect = encodeURIComponent(path);
  window.location.href = `/login?redirect=${redirect}`;
}

function buildQuery(query?: ListQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!isRememberMeEnabled()) return false;
  const refresh = getRefreshToken();
  if (!refresh) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const tokens = await refreshTokens(refresh);
        setTokens(tokens.accessToken, tokens.refreshToken);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: { companyId?: string | null; skipAuth?: boolean },
): Promise<T> {
  const { data } = await apiFetchRaw<T>(path, init, options);
  return data;
}

export async function apiFetchRaw<T>(
  path: string,
  init: RequestInit = {},
  options?: { companyId?: string | null; skipAuth?: boolean; _retried?: boolean },
): Promise<{ data: T; meta?: PaginationMeta & Record<string, unknown> }> {
  const headers = withNgrokSkipBrowserWarning(new Headers(init.headers));
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options?.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const companyId = options?.companyId === undefined ? getStoredCompanyId() : options.companyId;
  if (companyId) {
    headers.set('x-company-id', companyId);
  }

  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    ...init,
    headers,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON
  }

  if (response.status === 401 && !options?.skipAuth && !options?._retried) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiFetchRaw<T>(path, init, { ...options, _retried: true });
    }
    clearSession();
    redirectToLogin();
    throw new ApiError(
      payload?.error?.message ?? 'Session expired. Please sign in again.',
      401,
      payload?.error?.code,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.error?.code,
    );
  }

  return {
    data: (payload?.data ?? payload) as T,
    meta: payload?.meta,
  };
}

export async function apiList<T>(
  path: string,
  query?: ListQuery,
  options?: { companyId?: string | null },
): Promise<PaginatedResult<T>> {
  const { data, meta } = await apiFetchRaw<T[]>(`${path}${buildQuery(query)}`, {}, options);
  return {
    items: data ?? [],
    meta: {
      page: Number(meta?.page ?? query?.page ?? 1),
      limit: Number(meta?.limit ?? query?.limit ?? 20),
      total: Number(meta?.total ?? data?.length ?? 0),
      totalPages: Number(meta?.totalPages ?? 1),
    },
  };
}

export { buildQuery };
