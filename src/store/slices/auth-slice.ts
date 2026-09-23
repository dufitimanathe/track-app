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
        membershipId: string;
      }>,
    ) {
      state.isAuthenticated = true;
      state.hydrated = true;
      Object.assign(state, action.payload);
    },
    clearSession(state) {
      Object.assign(state, { ...initialState, hydrated: true });
    },
  },
});

export const { setHydrated, setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
