/** Routes anyone can open without signing in (marketing + auth flows). */
export const PUBLIC_ROUTE_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
  '/activate',
] as const;

export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  const path = pathname.split('?')[0] || '/';
  if (path === '/') return true;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => prefix !== '/' && (path === prefix || path.startsWith(`${prefix}/`)),
  );
}

/** Workspace areas that require an authenticated membership. */
export function isProtectedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split('?')[0] || '/';
  return (
    path.startsWith('/admin') ||
    path.startsWith('/platform') ||
    path.startsWith('/supervisor') ||
    path.startsWith('/accountant') ||
    path.startsWith('/rider')
  );
}
