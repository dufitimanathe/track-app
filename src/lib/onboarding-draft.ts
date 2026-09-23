const KEY = 'fleetops_onboarding_admin';

export interface OnboardingAdminDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export function saveAdminDraft(draft: OnboardingAdminDraft): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function loadAdminDraft(): OnboardingAdminDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingAdminDraft;
  } catch {
    return null;
  }
}

export function clearAdminDraft(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}
