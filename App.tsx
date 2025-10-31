import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PayrollTable } from './components/PayrollTable';
import { PayrollSummaryByMonth } from './components/PayrollSummaryByMonth';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { EmployeesView } from './components/EmployeesView';
import { MestrisView } from './components/MestrisView';
import { AddMestriModal } from './components/AddMestriModal';
import Login from './pages/Login';

import { Employee, Mestri, PaymentMethod, PaymentStatus, EmployeeStatus, PayrollData } from './src/types/firestore';

import { calculatePayroll, exportPayrollToExcel } from './services/payrollService';
import { useAppSelector, useAppDispatch } from './redux/hooks';
import {
  setActiveMenu,
  setAddEmployeeModalOpen,
  setAddMestriModalOpen,
  setStatusFilter,
  toggleTheme
} from './redux/slices/uiSlice';
import { addEmployeeWithId, fetchEmployees } from './redux/slices/employeesSlice';
import { createMestri as addMestriWithId, fetchMestris, editMestri as updateMestri } from './redux/slices/mestriSlice';
import { updateEmployeePayroll, changeMonth, createDefaultPayroll, fetchPayrolls } from './redux/slices/payrollSlice';
import { LastEmployeeData } from './services/lastEmployeeService';
import { fetchLastEmployees, selectLastEmployeesByMonth, updateEmployeePayroll as updateLastEmployeePayroll } from './redux/slices/lastEmployeesSlice';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LoadingOverlay } from './components/ui/LoadingSpinner';
import { ThemeToggle } from './components/ThemeToggle';
import { format } from 'date-fns';
import { formatMonthYear } from './src/utils/dateUtils';

// Helper to check if a month is in the future
const isFutureMonth = (monthString: string): boolean => {
  const [year, month] = monthString.split('-').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed
  return year > currentYear || (year === currentYear && month > currentMonth);
};

/* ✅ Helper to normalize Firestore dates */
const normalizeMestriDates = (mestri: Mestri): Mestri => {
  const getDate = (value?: string | Date | Timestamp): string => {
    if (!value) return new Date().toISOString();
    let date: Date;
    if (value instanceof Date) date = value;
    else if (value instanceof Timestamp) date = value.toDate();
    else date = new Date(value);
    return date.toISOString();
  };

  return {
    ...mestri,
    createdAt: getDate(mestri.createdAt),
    updatedAt: getDate(mestri.updatedAt),
  };
};

// Form payload coming from AddEmployeeModal
type AddEmployeeFormPayload = {
  empId: string;
  name: string;
  mestriId: string;
  perDayWage: number | string;
  joiningDate: string;
  ifsc: string;
  bankHolderName: string;
  accountNumber: string;
  phoneNumber: string;
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main Dashboard component (the original App logic)
interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const activitiesEndRef = useRef<HTMLDivElement>(null);

  const addActivity = useCallback((message: string, type: Activity['type'] = 'info') => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  }, []);

  // Auto-scroll to bottom when new activities are added
  useEffect(() => {
    activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  // Import employees as zeroed payroll for the selected month
  const importZeroedPayrollForMonth = async () => {
    for (const emp of masterEmployees) {
      const zeroPayroll = {
        ...emp,
        month: currentMonth,
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
        totalDuties: 0,
        salary: 0,
        otWages: 0,
        totalSalary: 0,
        netSalary: 0,
        balance: 0,
        paid: false,
        status: emp.status,
        remarks: '',
        id: `${emp.empId}_${currentMonth}`
      } as any;
      await dispatch(updateEmployeePayroll(zeroPayroll));
    }
    dispatch(fetchPayrolls(currentMonth));
  };

  // ✅ Redux state
  const { 
    activeMenu, 
    isAddEmployeeModalOpen, 
    isAddMestriModalOpen, 
    statusFilter
  } = useAppSelector(state => state.ui);

  const masterEmployees = useAppSelector(state => state.employees.masterList); // Assume Employee[]
  const mestriList = useAppSelector(state => state.mestri.list);
  const { payrollDataByMonth } = useAppSelector(state => state.payroll);
  const [payrollSearch, setPayrollSearch] = React.useState('');
  
  // Separate state for payroll view's selected month
  const [payrollMonth, setPayrollMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Current month for dashboard (always shows current month)
  const currentMonth = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // ✅ Normalize mestriList safely
  const normalizedMestris = useMemo(
    () => mestriList.map(mestri => normalizeMestriDates(mestri)),
    [mestriList]
  );

  // ✅ Fetch data on mount
  useEffect(() => {
    const init = async () => {
      try {
        addActivity('Fetching employees and mestris data...', 'info');
        await Promise.all([
          dispatch(fetchMestris()),
          dispatch(fetchEmployees(undefined)),
          dispatch(fetchPayrolls(new Date().toISOString().slice(0, 7))),
          dispatch(fetchLastEmployees(new Date().toISOString().slice(0, 7)) as any)
        ]);
        addActivity('Application initialized successfully', 'success');
      } catch (error) {
        addActivity('Failed to initialize application data', 'error');
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, [dispatch]);

  // Apply theme class on mount and log theme change
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    root.classList.remove('dark');
    root.classList.add('light');
    addActivity(`Theme set to light mode`, 'info');
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    // Only update the payroll month state, not the global currentMonth
    setPayrollMonth(month);
    dispatch(fetchLastEmployees(month) as any);
  }, [dispatch]);

  const handleUpdateEmployee = useCallback((updatedEmployee: PayrollData | LastEmployeeData) => {
    // Handle both PayrollData and LastEmployeeData types
    const empId = (updatedEmployee as any).empId || (updatedEmployee as any).employeeId;
    const { cashOrAccount, ...employeeData } = updatedEmployee as any;
    // Decide target collection based on month
    const now = new Date();
    const [y, m] = currentMonth.split('-').map(Number);
    const selectedDate = new Date(y, m - 1);
    const currentDate = new Date(now.getFullYear(), now.getMonth());
    const isPastMonth = selectedDate < currentDate;

    if (isPastMonth) {
      // Update lastemployees document
      const id = (updatedEmployee as any).id;
      if (id) {
        const { id: _omitId, ...rest } = employeeData as any;
        (dispatch as any)(updateLastEmployeePayroll({ id, data: { ...rest, month: currentMonth } }));
      }
      return;
    }

    // Convert LastEmployeeData to PayrollData format for payroll collection
    const payrollUpdate: Partial<PayrollData> = {
      ...employeeData,
      employeeId: empId,
      month: currentMonth,
      cashOrAccount: cashOrAccount ?? PaymentMethod.Cash,
    };

    if ((updatedEmployee as any).remarks !== undefined) {
      payrollUpdate.remarks = (updatedEmployee as any).remarks;
    }
    if ((updatedEmployee as any).mestri !== undefined) {
      payrollUpdate.mestri = (updatedEmployee as any).mestri;
    }

    dispatch(updateEmployeePayroll(payrollUpdate));
  }, [dispatch, currentMonth]);

  const handleAddEmployee = useCallback((newEmployeeData: AddEmployeeFormPayload) => {
    console.log('App - handleAddEmployee called with:', newEmployeeData);
    console.log('App - Selected mestriId:', newEmployeeData.mestriId);

    const employeePayload: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
      empId: newEmployeeData.empId,
      name: newEmployeeData.name,
      mestriId: newEmployeeData.mestriId,
      dept: 'General', // Default department
      perDayWage: Number(newEmployeeData.perDayWage) || 0,
      joiningDate: newEmployeeData.joiningDate,
      ifsc: newEmployeeData.ifsc,
      bankHolderName: newEmployeeData.bankHolderName,
      accountNumber: newEmployeeData.accountNumber,
      phoneNumber: newEmployeeData.phoneNumber,
      status: EmployeeStatus.Active
    };
    console.log('App - Employee payload being sent to firebase:', employeePayload);

    (async () => {
      const created = await dispatch(addEmployeeWithId(employeePayload) as any);
      const createdEmployee: Employee = (created as any).payload || created;
      console.log('App - Employee created from firebase:', createdEmployee);
      console.log('App - Created employee mestriId:', createdEmployee?.mestriId);

      if (createdEmployee?.empId) {
        console.log('App - Creating default payroll for employee:', createdEmployee.empId);
        await dispatch(createDefaultPayroll({ employee: createdEmployee, month: currentMonth }) as any);
      }
      dispatch(setAddEmployeeModalOpen(false));
    })();
  }, [dispatch, currentMonth]);

  const handleAddMestri = useCallback((newMestriData: Omit<Mestri, 'id'>) => {
    dispatch(addMestriWithId(newMestriData));
    dispatch(setAddMestriModalOpen(false));
  }, [dispatch]);

  const currentPayrollData = useMemo(() => {
    return payrollDataByMonth[payrollMonth] || [];
  }, [payrollDataByMonth, payrollMonth]);
  
  // Ensure we're using the correct month based on the active view
  const displayMonth = activeMenu === 'Payroll' ? payrollMonth : currentMonth;
  const lastEmployeesForMonth = useAppSelector(state => selectLastEmployeesByMonth(state as any, displayMonth));
  const processedPayrollData = useMemo(() => {
    const now = new Date();
    const [year, month] = displayMonth.split('-').map(Number);
    const selectedDate = new Date(year, month - 1);
    const currentDate = new Date(now.getFullYear(), now.getMonth());
    
    console.log('Processing data for month:', currentMonth, 'Data length:', currentPayrollData.length);
    
    // For past months, only return the data that exists
    if (selectedDate < currentDate) {
      console.log('Past month detected, returning lastemployees data');
      const filtered = (lastEmployeesForMonth as any[]).filter(emp =>
        statusFilter === 'All' || (emp.status || 'Unpaid') === statusFilter
      );
      return filtered as any[];
    }

    // For future months: return existing data or zeroed out data
    if (isFutureMonth(currentMonth)) {
      return masterEmployees
        .filter(emp => statusFilter === 'All' || emp.status === statusFilter)
        .map(emp => {
          // Check if we have existing payroll data for this employee and month
          const existingData = currentPayrollData.find(p => p.empId === emp.empId);
          
          // If we have existing data, use it; otherwise create zeroed data
          if (existingData) {
            return calculatePayroll(existingData);
          }
          
          // Create zeroed out data for new entries
          const zeroedData: PayrollData = {
            // Required fields with defaults
            id: `${emp.empId}_${currentMonth}`,
            employeeId: emp.empId,
            mestriId: emp.mestriId || '',
            month: currentMonth,
            name: emp.name,
            empId: emp.empId,
            dept: emp.dept || '',
            designation: '',
            joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
            
            // Payment and calculation fields
            basic: 0,
            dailyWage: emp.perDayWage || 0,
            perDayWage: emp.perDayWage || 0,
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
            
            // Additional fields
            sNo: 0,
            pf: 0,
            esi: 0,
            tds: 0,
            others: 0,
            bonus: 0,
            cash: 0,
            cashOrAccount: PaymentMethod.Cash,
            paid: false,
            status: PaymentStatus.Unpaid,
            
            // Bank details
            accountNumber: emp.accountNumber || '',
            ifsc: emp.ifsc || '',
            bankName: '', // Not available on Employee, will be empty
            bankHolderName: emp.bankHolderName || '',
            
            // Calculated fields
            totalDuties: 0,
            salary: 0,
            otWages: 0,
            totalSalary: 0,
            netSalary: 0,
            balance: 0,
            
            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // Optional field
            employeeDocId: emp.id
          };
          return calculatePayroll(zeroedData);
        });
    }

    // For current and future months: merge existing payroll data with master employees list
    const employeeMap = new Map<string, PayrollData>();
    
    // First add all master employees with default/zero values
    masterEmployees.forEach(emp => {
      if (statusFilter !== 'All' && emp.status !== statusFilter) return;
      
      employeeMap.set(emp.empId, calculatePayroll({
        ...emp,
        month: currentMonth,
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
        totalDuties: 0,
        salary: 0,
        otWages: 0,
        totalSalary: 0,
        netSalary: 0,
        balance: 0,
        paid: false,
        status: emp.status,
        remarks: '',
        id: `${emp.empId}_${currentMonth}`
      } as any));
    });

    // Then override with any existing payroll data
    currentPayrollData.forEach(payroll => {
      if (statusFilter !== 'All' && payroll.status !== statusFilter) return;
      employeeMap.set(payroll.empId, calculatePayroll(payroll));
    });

    return Array.from(employeeMap.values());
  }, [currentPayrollData, statusFilter, masterEmployees, currentMonth, lastEmployeesForMonth]);
  
  // Resolve mestri name from id for searching
  const getMestriNameById = useCallback((mestriId: string | undefined) => {
    if (!mestriId) return '';
    const m = normalizedMestris.find(m => (m as any).mestriId === mestriId || (m as any).id === mestriId);
    return (m?.name || '').toLowerCase();
  }, [normalizedMestris]);

  // Apply search filter for Payroll view
  const visiblePayrollData = useMemo(() => {
    if (!payrollSearch) return processedPayrollData;
    const q = payrollSearch.toLowerCase();
    return processedPayrollData.filter((e: any) => {
      // Safe string conversion for search fields
      const nameMatch = (e.name?.toString() || '').toLowerCase().includes(q);
      const empIdMatch = (e.empId?.toString() || '').toLowerCase().includes(q);
      const mestriFromId = getMestriNameById(e.mestriId);
      const mestriInline = (e.mestri?.toString() || '').toLowerCase();
      const mestriMatch = mestriFromId.includes(q) || mestriInline.includes(q);
      return nameMatch || empIdMatch || mestriMatch;
    });
  }, [processedPayrollData, payrollSearch, getMestriNameById]);
  
  const filteredMasterEmployees = useMemo(() => {
    return masterEmployees.filter(emp => statusFilter === 'All' || emp.status === statusFilter);
  }, [masterEmployees, statusFilter]);

  // Check if any modal is open
  const isModalOpen = isAddEmployeeModalOpen || isAddMestriModalOpen;

  return (
    <div className="relative bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-inter flex transition-colors duration-300">
      {/* Sidebar - Always in DOM but visually hidden when modal is open */}
      <div className={`transition-opacity duration-300 ${isModalOpen ? 'opacity-0' : 'opacity-100'}`}>
        <Sidebar activeMenu={activeMenu} setActiveMenu={(menu) => dispatch(setActiveMenu(menu))} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* background gradient effects */}
        <div className="absolute inset-0 bg-black opacity-70 z-0 dark:visible invisible"></div>
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse-slow -z-1"></div>
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full filter blur-3xl animate-pulse-slow delay-2000 -z-1"></div>
        
        <div className={`relative z-10 flex flex-col flex-1 p-4 sm:p-6 lg:p-8 bg-transparent dark:backdrop-blur-sm dark:bg-gray-900/30 overflow-hidden transition-opacity duration-300 ${isModalOpen ? 'opacity-30' : 'opacity-100'}`}>
          <Header
            months={Object.keys(payrollDataByMonth).sort().reverse()}
            currentMonth={activeMenu === 'Payroll' ? payrollMonth : currentMonth}
            onMonthChange={activeMenu === 'Payroll' ? handleMonthChange : undefined}
            onAddEmployee={() => dispatch(setAddEmployeeModalOpen(true))}
            onAddMestri={() => dispatch(setAddMestriModalOpen(true))}
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => dispatch(setStatusFilter(status))}
            activeView={activeMenu}
            searchTerm={payrollSearch}
            onSearchChange={setPayrollSearch}
            onExport={() => {
              exportPayrollToExcel(visiblePayrollData as any[], payrollSearch ? `payroll_${currentMonth}_filtered` : `payroll_${currentMonth}_all`);
            }}
          />
          <div className="flex-1 flex flex-col overflow-hidden mt-4">
            {activeMenu === 'Dashboard' && (
              <div className="flex-1 overflow-auto pr-2">
                {/* Dashboard Overview */}
                <div className="space-y-6">
                  {/* Welcome Section */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Welcome to Payroll Management</h2>
                    <p className="text-blue-100">Manage your employees, mestris, and payroll efficiently</p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Total Employees */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Employees</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {filteredMasterEmployees.length}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shadow-inner">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex h-1.5 w-1.5 mr-1.5 rounded-full bg-blue-500"></span>
                          <span>Active in the system</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Mestris */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Mestris</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {normalizedMestris.length}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center shadow-inner">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex h-1.5 w-1.5 mr-1.5 rounded-full bg-green-500"></span>
                          <span>Manages {masterEmployees.length} employees</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Active Employees</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {masterEmployees.filter(emp => emp.status === 'Active').length}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/ {masterEmployees.length} total</span>
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center shadow-inner">
                          <div className="relative">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{masterEmployees.filter(emp => emp.status === 'Active').length}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex h-1.5 w-1.5 mr-1.5 rounded-full bg-green-500"></span>
                          <span>{((masterEmployees.filter(emp => emp.status === 'Active').length / masterEmployees.length) * 100).toFixed(0)}% active workforce</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Month Payroll */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Current Month</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatMonthYear(currentMonth)}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shadow-inner">
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex h-1.5 w-1.5 mr-1.5 rounded-full bg-blue-500"></span>
                          <span>Active payroll period</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Payroll */}
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 shadow-lg border border-slate-100 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Payroll</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₹{processedPayrollData.reduce((sum, emp) => sum + (emp.totalSalary || 0), 0).toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">this month</span>
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shadow-inner">
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex h-1.5 w-1.5 mr-1.5 rounded-full bg-blue-500"></span>
                          <span>{(processedPayrollData.filter(emp => emp.paid).length / processedPayrollData.length * 100).toFixed(0)}% processed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => dispatch(setAddEmployeeModalOpen(true))}
                          className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">Add New Employee</span>
                        </button>
                        <button
                          onClick={() => dispatch(setAddMestriModalOpen(true))}
                          className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">Add New Mestri</span>
                        </button>
                        <button
                          onClick={() => dispatch(setActiveMenu('Payroll'))}
                          className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">View Payroll</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/10 rounded-full"></div>
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Payroll Overview</h3>
                        <p className="text-blue-100 text-sm mb-6">Current month summary</p>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                            <p className="text-xs text-blue-100 mb-1">Total Payroll</p>
                            <p className="text-2xl font-bold">
                              ₹{visiblePayrollData.reduce((sum, emp: any) => sum + (emp.netSalary || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                            <p className="text-xs text-blue-100 mb-1">Active Staff</p>
                            <p className="text-2xl font-bold">
                              {filteredMasterEmployees.filter(emp => emp.status === 'active' || emp.status === 'Active').length}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Payroll Progress</span>
                            <span className="text-sm font-medium">
                              {((visiblePayrollData.filter(emp => emp.paid).length / Math.max(1, visiblePayrollData.length)) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-white h-2 rounded-full" 
                              style={{ width: `${(visiblePayrollData.filter(emp => emp.paid).length / Math.max(1, visiblePayrollData.length)) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-2 text-blue-100">
                            <span>{visiblePayrollData.filter(emp => emp.paid).length} Paid</span>
                            <span>{visiblePayrollData.filter(emp => !emp.paid).length} Pending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeMenu === 'Payroll' && (
              <div className="flex-1 overflow-auto pr-2">
                <PayrollTable
                  data={visiblePayrollData}
                  currentMonth={currentMonth}
                  onUpdateEmployee={handleUpdateEmployee}
                  searchTerm={payrollSearch}
                />
              </div>
            )}
            {activeMenu === 'Employees' && (
              <EmployeesView employees={filteredMasterEmployees} mestriList={normalizedMestris} />
            )}
            {activeMenu === 'Mestris' && (
              <MestrisView
                mestriList={normalizedMestris}
                onEditMestri={(updatedMestri) => dispatch(updateMestri(updatedMestri))}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          {isAddEmployeeModalOpen && (
            <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <AddEmployeeModal
                onClose={() => dispatch(setAddEmployeeModalOpen(false))}
                onAddEmployee={handleAddEmployee}
                mestriList={normalizedMestris}
              />
            </div>
          )}
          {isAddMestriModalOpen && (
            <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <AddMestriModal
                onClose={() => dispatch(setAddMestriModalOpen(false))}
                onAddMestri={handleAddMestri}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main App component with routing
const App: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Simulate app loading time (you can replace this with actual app initialization)
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const isLoading = loading || appLoading;

  return (
    <ThemeProvider>
      <div className="app min-h-screen bg-background text-foreground">
        {isLoading ? (
          <LoadingOverlay message="Loading application..." />
        ) : (
          <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;