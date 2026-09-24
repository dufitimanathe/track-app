import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@/types';

export interface AuthState {
  hydrated: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  userId: string;
  userName: string;
  userEmail: string;
  avatarInitials: string;
  companyId: string;
  companyName: string;
  companyInitials: string;
  companyStatus: string;
  membershipId: string;
}

const initialState: AuthState = {
  hydrated: false,
  isAuthenticated: false,
  role: 'COMPANY_ADMIN',
  userId: '',
  userName: '',
  userEmail: '',
  avatarInitials: '',
  companyId: '',
  companyName: '',
  companyInitials: '',
  companyStatus: 'ACTIVE',
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
        role: UserRole;
        companyId: string;
        companyName: string;
        companyInitials: string;
        companyStatus?: string;
        membershipId: string;
      }>,
    ) {
      state.isAuthenticated = true;
      state.hydrated = true;
      Object.assign(state, {
        ...action.payload,
        companyStatus: action.payload.companyStatus ?? 'ACTIVE',
      });
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

export const { setHydrated, setSession, clearSession, setCompanyProfile } = authSlice.actions;
export default authSlice.reducer;
