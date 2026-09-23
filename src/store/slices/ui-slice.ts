import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  selectedMotorcycleId: string | null;
  selectedRequestId: string | null;
  selectedTripId: string | null;
}

const initialState: UiState = {
  sidebarOpen: false,
  sidebarCollapsed: false,
  searchOpen: false,
  notificationsOpen: false,
  selectedMotorcycleId: null,
  selectedRequestId: null,
  selectedTripId: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.searchOpen = action.payload;
    },
    setNotificationsOpen(state, action: PayloadAction<boolean>) {
      state.notificationsOpen = action.payload;
    },
    setSelectedMotorcycleId(state, action: PayloadAction<string | null>) {
      state.selectedMotorcycleId = action.payload;
    },
    setSelectedRequestId(state, action: PayloadAction<string | null>) {
      state.selectedRequestId = action.payload;
    },
    setSelectedTripId(state, action: PayloadAction<string | null>) {
      state.selectedTripId = action.payload;
    },
  },
});

export const {
  setSidebarOpen,
  toggleSidebar,
  toggleSidebarCollapsed,
  setSearchOpen,
  setNotificationsOpen,
  setSelectedMotorcycleId,
  setSelectedRequestId,
  setSelectedTripId,
} = uiSlice.actions;

export default uiSlice.reducer;
