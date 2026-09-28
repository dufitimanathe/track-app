import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CompanyType } from '@/lib/navigation';
import type { UserRole } from '@/types';

export interface AuthState {
  hydrated: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  userId: string;
  userName: string;
  userEmail: string;
  avatarInitials: string;
  avatarUrl: string | null;
  companyId: string;
  companyName: string;
  companyInitials: string;
  companyStatus: string;
  companyType: CompanyType;
  operatorCompanyId: string | null;
  membershipId: string;
}

const initialState: AuthState = {
  hydrated: false,
  isAuthenticated: false,
  role: 'PLATFORM_ADMIN',
  userId: '',
  userName: '',
  userEmail: '',
  avatarInitials: '',
  avatarUrl: null,
  companyId: '',
  companyName: '',
  companyInitials: '',
  companyStatus: 'ACTIVE',
  companyType: 'CLIENT',
  operatorCompanyId: null,
  membershipId: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
    setSession(
      state,
      action: PayloadAction<{
        userId: string;
        userName: string;
        userEmail: string;
        avatarInitials: string;
        avatarUrl?: string | null;
        role: UserRole;
        companyId: string;
        companyName: string;
        companyInitials: string;
        companyStatus?: string;
        companyType?: CompanyType;
        operatorCompanyId?: string | null;
        membershipId: string;
      }>,
    ) {
      state.isAuthenticated = true;
      state.hydrated = true;
      Object.assign(state, {
        ...action.payload,
        avatarUrl: action.payload.avatarUrl ?? null,
        companyStatus: action.payload.companyStatus ?? 'ACTIVE',
        companyType: action.payload.companyType ?? 'CLIENT',
        operatorCompanyId: action.payload.operatorCompanyId ?? null,
      });
    },
    setAvatarUrl(state, action: PayloadAction<string | null>) {
      state.avatarUrl = action.payload;
    },
    clearSession(state) {
      Object.assign(state, { ...initialState, hydrated: true });
    },
    setCompanyProfile(
      state,
      action: PayloadAction<{ companyId: string; name: string; initials: string }>,
    ) {
      if (state.companyId !== action.payload.companyId) return;
      state.companyName = action.payload.name;
      state.companyInitials = action.payload.initials;
    },
  },
});

export const { setHydrated, setSession, clearSession, setCompanyProfile, setAvatarUrl } =
  authSlice.actions;
export default authSlice.reducer;
