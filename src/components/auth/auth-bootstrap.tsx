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
import { homeForRole } from '@/lib/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearSession, setHydrated, setSession } from '@/store/slices/auth-slice';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const PUBLIC_PREFIXES = ['/login', '/register', '/forgot-password', '/onboarding', '/activate'];

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, isAuthenticated, role } = useAppSelector((s) => s.auth);

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
    const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (!isAuthenticated && !isPublic) {
      const redirect = encodeURIComponent(`${pathname}`);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    if (isAuthenticated && (pathname === '/' || pathname === '/login')) {
      router.replace(homeForRole(role));
    }
  }, [hydrated, isAuthenticated, pathname, role, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-text-secondary">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
