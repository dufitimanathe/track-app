'use client';

import {
  companyInitials,
  displayName,
  fetchMe,
  initialsOf,
  pickMembership,
} from '@/lib/api/auth';
import {
  clearSession as clearStorage,
  getAccessToken,
  getStoredCompanyId,
  setStoredCompanyId,
} from '@/lib/api/client';
import { destinationForMembership, homeForRole, isClientBlockedPath } from '@/lib/navigation';
import { isProtectedRoute, isPublicRoute } from '@/lib/public-routes';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearSession, setHydrated, setSession } from '@/store/slices/auth-slice';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, isAuthenticated, role, companyStatus, companyType } = useAppSelector((s) => s.auth);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getAccessToken();
      if (!token) {
        if (!cancelled) dispatch(setHydrated(true));
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        const membership =
          me.memberships.find((m) => m.companyId === getStoredCompanyId()) ??
          pickMembership(me.memberships);

        if (!membership) {
          clearStorage();
          dispatch(clearSession());
          return;
        }

        setStoredCompanyId(membership.companyId);
        dispatch(
          setSession({
            userId: me.user.id,
            userName: displayName(me.user),
            userEmail: me.user.email ?? '',
            avatarInitials: initialsOf(me.user),
            role: membership.role,
            companyId: membership.companyId,
            companyName: membership.companyName,
            companyInitials: companyInitials(membership.companyName),
            companyStatus: membership.companyStatus ?? 'ACTIVE',
            companyType: membership.companyType ?? 'CLIENT',
            operatorCompanyId: me.operatorCompanyId ?? null,
            membershipId: membership.id,
          }),
        );
      } catch {
        clearStorage();
        if (!cancelled) dispatch(clearSession());
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;

    // Guests may freely browse landing + auth/marketing pages.
    if (!isAuthenticated) {
      if (isProtectedRoute(pathname)) {
        const redirect = encodeURIComponent(pathname || '/');
        router.replace(`/login?redirect=${redirect}`);
      }
      return;
    }

    // Signed-in users keep access to the public home/landing pages.
    if (pathname === '/login') {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const redirect = params.get('redirect');
      // Only auto-leave login for a protected destination (or role home).
      if (redirect && redirect.startsWith('/') && isProtectedRoute(redirect)) {
        router.replace(redirect);
      } else if (!redirect || redirect === '/') {
        router.replace(destinationForMembership({ role, companyStatus }));
      }
      return;
    }

    if (
      role === 'COMPANY_ADMIN' &&
      (companyStatus === 'PENDING_REVIEW' || companyStatus === 'REJECTED') &&
      pathname.startsWith('/admin')
    ) {
      router.replace('/onboarding/pending');
      return;
    }

    if (isClientBlockedPath(pathname, companyType)) {
      router.replace(homeForRole(role));
    }
  }, [hydrated, isAuthenticated, pathname, role, companyStatus, companyType, router]);

  // Never block the public landing behind a loading gate.
  if (!hydrated && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-text-secondary">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
