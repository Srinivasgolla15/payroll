import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EmployeeStatus } from '../../types';

type Theme = 'light' | 'dark';

interface UIState {
  activeMenu: string;
  isAddEmployeeModalOpen: boolean;
  isAddMestriModalOpen: boolean;
  statusFilter: EmployeeStatus | 'All';
  theme: Theme;
}

const initialState: UIState = {
  activeMenu: 'Payroll',
  isAddEmployeeModalOpen: false,
  isAddMestriModalOpen: false,
  statusFilter: 'All',
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveMenu(state, action: PayloadAction<string>) {
      state.activeMenu = action.payload;
    },
    setAddEmployeeModalOpen(state, action: PayloadAction<boolean>) {
      state.isAddEmployeeModalOpen = action.payload;
    },
    setAddMestriModalOpen(state, action: PayloadAction<boolean>) {
      state.isAddMestriModalOpen = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<EmployeeStatus | 'All'>) {
      state.statusFilter = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { 
    setActiveMenu, 
    setAddEmployeeModalOpen, 
    setAddMestriModalOpen, 
    setStatusFilter, 
    toggleTheme 
} = uiSlice.actions;
export default uiSlice.reducer;
