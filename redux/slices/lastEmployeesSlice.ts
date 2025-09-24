import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { LastEmployeeData } from '../../services/lastEmployeeService';
import { getLastEmployeesByMonth, saveLastEmployee, updateLastEmployee } from '../../services/lastEmployeeService';

interface LastEmployeesState {
  employeesByMonth: { [month: string]: LastEmployeeData[] };
  currentMonth: string;
  loading: boolean;
  error: string | null;
}

const initialState: LastEmployeesState = {
  employeesByMonth: {},
  currentMonth: new Date().toISOString().slice(0, 7),
  loading: false,
  error: null,
};

export const fetchLastEmployees = createAsyncThunk<
  { month: string; data: LastEmployeeData[] },
  string,
  { state: RootState }
>(
  'lastEmployees/fetchLastEmployees',
  async (month, { rejectWithValue }) => {
    try {
      const data = await getLastEmployeesByMonth(month);
      return { month, data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch last employees');
    }
  }
);

export const saveEmployeeAndPayroll = createAsyncThunk<
  LastEmployeeData,
  Omit<LastEmployeeData, 'id' | 'createdAt' | 'updatedAt'>,
  { state: RootState }
>(
  'lastEmployees/saveEmployeeAndPayroll',
  async (data, { rejectWithValue }) => {
    try {
      const result = await saveLastEmployee(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save employee and payroll');
    }
  }
);

export const updateEmployeePayroll = createAsyncThunk<
  LastEmployeeData,
  { id: string; data: Partial<LastEmployeeData> },
  { state: RootState }
>(
  'lastEmployees/updateEmployeePayroll',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await updateLastEmployee(id, data);
      return { id, ...data } as LastEmployeeData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update employee payroll');
    }
  }
);

const lastEmployeesSlice = createSlice({
  name: 'lastEmployees',
  initialState,
  reducers: {
    setCurrentMonth: (state, action: PayloadAction<string>) => {
      state.currentMonth = action.payload;
    },
    resetLastEmployeesState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Last Employees
    builder.addCase(fetchLastEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLastEmployees.fulfilled, (state, action) => {
      const { month, data } = action.payload;
      state.employeesByMonth[month] = data;
      state.loading = false;
    });
    builder.addCase(fetchLastEmployees.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Save Employee and Payroll
    builder.addCase(saveEmployeeAndPayroll.fulfilled, (state, action) => {
      const month = action.payload.month;
      if (!state.employeesByMonth[month]) {
        state.employeesByMonth[month] = [];
      }
      state.employeesByMonth[month].push(action.payload);
    });

    // Update Employee Payroll
    builder.addCase(updateEmployeePayroll.fulfilled, (state, action) => {
      const { id, month } = action.payload;
      const monthEmployees = state.employeesByMonth[month] || [];
      const index = monthEmployees.findIndex(emp => emp.id === id);
      if (index !== -1) {
        state.employeesByMonth[month][index] = { ...state.employeesByMonth[month][index], ...action.payload };
      }
    });
  },
});

export const { setCurrentMonth, resetLastEmployeesState } = lastEmployeesSlice.actions;

export const selectLastEmployeesByMonth = (state: RootState, month: string) => 
  state.lastEmployees.employeesByMonth[month] || [];

export default lastEmployeesSlice.reducer;
