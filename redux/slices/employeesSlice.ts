import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Employee, EmployeeStatus } from '../../src/types/firestore';
import { getEmployees, addEmployee as addEmployeeToFirestore, updateEmployee as updateEmployeeInFirestore } from '../../services/firebase';
import { AppThunk } from '../store';

interface EmployeesState {
  masterList: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  masterList: [],
  loading: false,
  error: null,
};

// Async thunk for fetching employees
const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (mestriId: string | undefined, { rejectWithValue }) => {
    try {
      return await getEmployees(mestriId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding a new employee (uses provided empId)
const addNewEmployee = createAsyncThunk(
  'employees/addEmployee',
  async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newEmployee: Partial<Employee> = {
        ...employeeData,
        status: employeeData.status || EmployeeStatus.Active,
        joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
      };
      return await addEmployeeToFirestore(newEmployee);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating an existing employee
const updateExistingEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async (employeeData: Employee, { rejectWithValue }) => {
    try {
      return await updateEmployeeInFirestore(employeeData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearEmployeeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch employees
    builder.addCase(fetchEmployees.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEmployees.fulfilled, (state, action) => {
      state.loading = false;
      state.masterList = action.payload;
    });
    builder.addCase(fetchEmployees.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add employee
    builder.addCase(addNewEmployee.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addNewEmployee.fulfilled, (state, action) => {
      state.loading = false;
      state.masterList.push(action.payload);
    });
    builder.addCase(addNewEmployee.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update employee
    builder.addCase(updateExistingEmployee.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateExistingEmployee.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.masterList.findIndex(e => e.id === action.payload.id);
      if (index !== -1) state.masterList[index] = action.payload;
    });
    builder.addCase(updateExistingEmployee.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Export actions
export const { clearEmployeeError } = employeesSlice.actions;

// Export thunks
export { fetchEmployees, addNewEmployee, updateExistingEmployee };

// Thunk for adding employee with generated ID
export const addEmployeeWithId = (
  employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): AppThunk<Promise<Employee>> => async (dispatch) => {
  try {
    const created = await dispatch(addNewEmployee(employeeData)).unwrap();
    return created;
  } catch (error) {
    console.error('Failed to add employee:', error);
    throw error as any;
  }
};

export default employeesSlice.reducer;
