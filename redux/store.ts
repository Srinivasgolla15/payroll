import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import uiReducer from './slices/uiSlice';
import mestriReducer from './slices/mestriSlice';
import employeesReducer from './slices/employeesSlice';
import payrollReducer from './slices/payrollSlice';
import lastEmployeesReducer from './slices/lastEmployeesSlice';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    mestri: mestriReducer,
    employees: employeesReducer,
    payroll: payrollReducer,
    lastEmployees: lastEmployeesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(thunk),  // Add thunk middleware here
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;