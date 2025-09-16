import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import mestriReducer from './slices/mestriSlice';
import employeesReducer from './slices/employeesSlice';
import payrollReducer from './slices/payrollSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    mestri: mestriReducer,
    employees: employeesReducer,
    payroll: payrollReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
