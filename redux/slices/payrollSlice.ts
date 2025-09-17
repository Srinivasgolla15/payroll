import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { PayrollData, PaymentMethod, PaymentStatus, Employee } from '../../src/types/firestore';
import { getPayrolls as getFirebasePayrolls, savePayroll as saveFirebasePayroll } from '../../services/payrollService';

interface PayrollState {
  payrollDataByMonth: { [month: string]: PayrollData[] };
  currentMonth: string;
  loading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  payrollDataByMonth: {},
  currentMonth: new Date().toISOString().slice(0, 7),
  loading: false,
  error: null,
};

// Async thunk for fetching payrolls
export const fetchPayrolls = createAsyncThunk<PayrollData[], string, { state: RootState }>(
  'payroll/fetchPayrolls',
  async (month, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      // Pass empty filter object to maintain backward compatibility
      return await getFirebasePayrolls(month, {});
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payrolls');
    }
  }
);

// Helper function to update future payrolls when Mestri changes
const updateFuturePayrolls = async (employeeId: string, mestriId: string, currentMonth: string) => {
  try {
    // Get the current date and calculate the next month
    const [year, month] = currentMonth.split('-').map(Number);
    const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // Get all future payrolls for this employee
    const futurePayrolls = await getFirebasePayrolls(nextMonth, { employeeId });
    
    // Update each future payroll with the new Mestri ID
    const updates = futurePayrolls.map(payroll => {
      // Create a new object with the updated Mestri ID
      const updatedPayroll = { ...payroll };
      updatedPayroll.mestriId = mestriId;
      updatedPayroll.updatedAt = new Date().toISOString();
      
      // Remove the mestri object to avoid Firestore errors
      if ('mestri' in updatedPayroll) {
        delete (updatedPayroll as any).mestri;
      }
      
      return updatedPayroll;
    });
    
    // Save all updated payrolls
    return await Promise.all(updates.map(saveFirebasePayroll));
  } catch (error) {
    console.error('Error updating future payrolls:', error);
    throw error;
  }
};

// Async thunk for updating payroll
export const updateEmployeePayroll = createAsyncThunk<PayrollData, Partial<PayrollData>>(
  'payroll/updateEmployeePayroll',
  async (partialData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const month = partialData.month || state.payroll.currentMonth;
      
      // Get the existing payroll data for this employee if it exists
      const existingData = state.payroll.payrollDataByMonth[month]?.find(
        (p) => p.employeeId === partialData.employeeId
      );

      // Check if Mestri is being changed
      const isMestriChanging = partialData.mestriId && 
        existingData?.mestriId && 
        partialData.mestriId !== existingData.mestriId;

      // Create a new object with the updated data
      const fullData: PayrollData = {
        ...existingData, // Spread existing data first to preserve all fields
        ...partialData,  // Then override with updated values
        month,
        id: partialData.id || existingData?.id || `${partialData.employeeId}_${month}`,
        employeeId: partialData.employeeId || existingData?.employeeId || '',
        mestriId: partialData.mestriId || existingData?.mestriId || '',
        name: partialData.name || existingData?.name || '',
        empId: partialData.empId || existingData?.empId || '',
        dept: partialData.dept || existingData?.dept || '',
        designation: partialData.designation || existingData?.designation || '',
        joiningDate: partialData.joiningDate || existingData?.joiningDate || new Date().toISOString(),
        cashOrAccount: partialData.cashOrAccount ?? existingData?.cashOrAccount ?? PaymentMethod.Cash,
        paid: partialData.paid ?? existingData?.paid ?? false,
        status: partialData.status ?? existingData?.status ?? PaymentStatus.Pending,
        basic: partialData.basic ?? existingData?.basic ?? 0,
        dailyWage: partialData.dailyWage ?? existingData?.dailyWage ?? 0,
        perDayWage: partialData.perDayWage ?? existingData?.perDayWage ?? 0,
        duties: partialData.duties ?? existingData?.duties ?? 0,
        ot: partialData.ot ?? existingData?.ot ?? 0,
        advance: partialData.advance ?? existingData?.advance ?? 0,
        ph: partialData.ph ?? existingData?.ph ?? 0,
        bus: partialData.bus ?? existingData?.bus ?? 0,
        food: partialData.food ?? existingData?.food ?? 0,
        eb: partialData.eb ?? existingData?.eb ?? 0,
        shoes: partialData.shoes ?? existingData?.shoes ?? 0,
        karcha: partialData.karcha ?? existingData?.karcha ?? 0,
        lastMonth: partialData.lastMonth ?? existingData?.lastMonth ?? 0,
        deductions: partialData.deductions ?? existingData?.deductions ?? 0,
        totalPayment: partialData.totalPayment ?? existingData?.totalPayment ?? 0,
        sNo: partialData.sNo ?? existingData?.sNo ?? 0,
        pf: partialData.pf ?? existingData?.pf ?? 0,
        esi: partialData.esi ?? existingData?.esi ?? 0,
        tds: partialData.tds ?? existingData?.tds ?? 0,
        others: partialData.others ?? existingData?.others ?? 0,
        bonus: partialData.bonus ?? existingData?.bonus ?? 0,
        cash: partialData.cash ?? existingData?.cash ?? 0,
        accountNumber: partialData.accountNumber ?? existingData?.accountNumber ?? "",
        ifsc: partialData.ifsc ?? existingData?.ifsc ?? "",
        bankName: partialData.bankName ?? existingData?.bankName ?? "",
        bankHolderName: partialData.bankHolderName ?? existingData?.bankHolderName ?? "",
        totalDuties: partialData.totalDuties ?? existingData?.totalDuties ?? 0,
        salary: partialData.salary ?? existingData?.salary ?? 0,
        otWages: partialData.otWages ?? existingData?.otWages ?? 0,
        totalSalary: partialData.totalSalary ?? existingData?.totalSalary ?? 0,
        netSalary: partialData.netSalary ?? existingData?.netSalary ?? 0,
        balance: partialData.balance ?? existingData?.balance ?? 0,
        updatedAt: new Date().toISOString(),
        createdAt: partialData.createdAt ?? existingData?.createdAt ?? new Date().toISOString(),
        remarks: partialData.remarks ?? existingData?.remarks ?? '',
      } as PayrollData;
      
      // Remove the mestri object to avoid Firestore errors
      if ('mestri' in fullData) {
        delete (fullData as any).mestri;
      }
      
      // Save the updated payroll
      const updatedPayroll = await saveFirebasePayroll(fullData);
      
      // If Mestri was changed, update all future payrolls
      if (isMestriChanging && fullData.employeeId && fullData.mestriId) {
        try {
          await updateFuturePayrolls(fullData.employeeId, fullData.mestriId, month);
        } catch (error) {
          console.error('Failed to update future payrolls with new Mestri:', error);
          // Don't fail the main operation if updating future payrolls fails
        }
      }
      
      return updatedPayroll;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update payroll');
    }
  }
);

// Async thunk for creating default payroll
export const createDefaultPayroll = createAsyncThunk<PayrollData, { employee: Employee; month: string }>(
  'payroll/createDefaultPayroll',
  async ({ employee, month }, { rejectWithValue }) => {
    try {
      const employeeId = employee.empId; // For display and id consistency
      const mestriId = employee.mestriId;
      const defaultPayroll: PayrollData = {
        id: `${employeeId}_${month}`,
        employeeId,
        mestriId,
        month,
        // strong reference fields
        ...( { employeeDocId: employee.id } as any ),
        // carry-over fields from employee
        name: employee.name || '',
        empId: employee.empId || employeeId,
        dept: (employee as any).dept || 'General',
        designation: (employee as any).designation || 'Worker',
        joiningDate: employee.joiningDate || new Date().toISOString(),
        cashOrAccount: PaymentMethod.Cash,
        paid: false,
        status: PaymentStatus.Pending,
        basic: 0,
        dailyWage: 0,
        perDayWage: Number(employee.perDayWage) || 0,
        duties: 0,
        ot: 0,
        advance: 0,
        ph: 0,
        bus: 0,
        food: 0,
        eb: 0,
        shoes: 0,
        karcha: 0,
        lastMonth: 0,
        deductions: 0,
        totalPayment: 0,
        sNo: 0,
        pf: 0,
        esi: 0,
        tds: 0,
        others: 0,
        bonus: 0,
        cash: 0,
        accountNumber: employee.accountNumber || "",
        ifsc: employee.ifsc || "",
        bankName: "",
        bankHolderName: employee.bankHolderName || "",
        totalDuties: 0,
        salary: 0,
        otWages: 0,
        totalSalary: 0,
        netSalary: 0,
        balance: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        remarks: '',
      };
      return await saveFirebasePayroll(defaultPayroll);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payroll');
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setCurrentMonth(state, action: PayloadAction<string>) {
      state.currentMonth = action.payload;
    },
    resetPayrollState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrolls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollDataByMonth[action.meta.arg] = action.payload;
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateEmployeePayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployeePayroll.fulfilled, (state, action) => {
        state.loading = false;
        const month = action.payload.month;
        if (!state.payrollDataByMonth[month]) {
          state.payrollDataByMonth[month] = [];
        }
        const index = state.payrollDataByMonth[month].findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.payrollDataByMonth[month][index] = action.payload;
        } else {
          state.payrollDataByMonth[month].push(action.payload);
        }
      })
      .addCase(updateEmployeePayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDefaultPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDefaultPayroll.fulfilled, (state, action) => {
        state.loading = false;
        const month = action.payload.month;
        if (!state.payrollDataByMonth[month]) {
          state.payrollDataByMonth[month] = [];
        }
        state.payrollDataByMonth[month].push(action.payload);
      })
      .addCase(createDefaultPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentMonth, resetPayrollState } = payrollSlice.actions;

// Thunk for changing month
export const changeMonth = (month: string) => (dispatch: any) => {
  dispatch(setCurrentMonth(month));
  dispatch(fetchPayrolls(month));
};

export default payrollSlice.reducer;