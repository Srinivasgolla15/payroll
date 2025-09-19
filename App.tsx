import React, { useMemo, useCallback, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PayrollTable } from './components/PayrollTable';
import { PayrollSummaryByMonth } from './components/PayrollSummaryByMonth';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { EmployeesView } from './components/EmployeesView';
import { MestrisView } from './components/MestrisView';
import { AddMestriModal } from './components/AddMestriModal';

import { Employee, Mestri, PaymentMethod, EmployeeStatus, PayrollData } from './src/types/firestore';

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

const App: React.FC = () => {
  const dispatch = useAppDispatch();

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
    statusFilter, 
    theme 
  } = useAppSelector(state => state.ui);

  const masterEmployees = useAppSelector(state => state.employees.masterList); // Assume Employee[]
  const mestriList = useAppSelector(state => state.mestri.list);
  const { currentMonth, payrollDataByMonth } = useAppSelector(state => state.payroll);
  const [payrollSearch, setPayrollSearch] = React.useState('');

  // ✅ Normalize mestriList safely
  const normalizedMestris = useMemo(
    () => mestriList.map(mestri => normalizeMestriDates(mestri)),
    [mestriList]
  );

  // ✅ Fetch data on mount
  useEffect(() => {
    dispatch(fetchMestris());
    dispatch(fetchEmployees(undefined)); // Fetch all employees
    dispatch(fetchPayrolls(new Date().toISOString().slice(0, 7)));
  }, [dispatch]);

  // ✅ Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleMonthChange = useCallback((month: string) => {
    dispatch(changeMonth(month));
  }, [dispatch]);

  const handleUpdateEmployee = useCallback((updatedEmployee: PayrollData) => {
    const { empId, cashOrAccount, ...employeeData } = updatedEmployee;
    const payrollUpdate: Partial<PayrollData> = {
      ...employeeData,
      employeeId: empId,
      month: currentMonth,
      cashOrAccount: cashOrAccount ?? PaymentMethod.Cash,
    };
    dispatch(updateEmployeePayroll(payrollUpdate));
  }, [dispatch, currentMonth]);

  const handleAddEmployee = useCallback((newEmployeeData: AddEmployeeFormPayload) => {
    const employeePayload: Partial<Employee> = {
      empId: newEmployeeData.empId,
      name: newEmployeeData.name,
      phoneNumber: newEmployeeData.phoneNumber,
      bankHolderName: newEmployeeData.bankHolderName,
      ifsc: newEmployeeData.ifsc,
      accountNumber: newEmployeeData.accountNumber,
      joiningDate: newEmployeeData.joiningDate,
      mestriId: newEmployeeData.mestriId,
      perDayWage: Number(newEmployeeData.perDayWage) || 0,
      status: EmployeeStatus.Active,
    };
    (async () => {
      const created = await dispatch(addEmployeeWithId(employeePayload) as any);
      const createdEmployee: Employee = (created as any).payload || created;
      if (createdEmployee?.empId) {
        await dispatch(createDefaultPayroll({ employee: createdEmployee, month: currentMonth }) as any);
      }
      dispatch(setAddEmployeeModalOpen(false));
    })();
  }, [dispatch, currentMonth]);

  const handleAddMestri = useCallback((newMestriData: Omit<Mestri, 'id'>) => {
    dispatch(addMestriWithId(newMestriData));
    dispatch(setAddMestriModalOpen(false));
  }, [dispatch]);

  const currentPayrollData = payrollDataByMonth[currentMonth] || [];
  const processedPayrollData = useMemo(() => {
    const now = new Date();
    const [year, month] = currentMonth.split('-').map(Number);
    const selectedDate = new Date(year, month - 1);
    // Past months: render only if data exists
    if (selectedDate < new Date(now.getFullYear(), now.getMonth())) {
      if (!currentPayrollData || currentPayrollData.length === 0) {
        return [];
      }
      const filteredData = currentPayrollData.filter(emp =>
        statusFilter === 'All' || emp.status === statusFilter
      );
      return filteredData.map(emp => calculatePayroll(emp));
    }
    // Future months in a future year: render nothing
    if (year > now.getFullYear()) {
      return [];
    }
    // Future months in current year (including current month):
    if (year === now.getFullYear() && month > (now.getMonth() + 1)) {
      // Show present employees with zeroed payrolls
      return masterEmployees.map(emp => calculatePayroll({
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
    }
    // Current month: normal payroll
    const filteredData = currentPayrollData.filter(emp =>
      statusFilter === 'All' || emp.status === statusFilter
    );
    return filteredData.map(emp => calculatePayroll(emp));
  }, [currentPayrollData, statusFilter, masterEmployees, currentMonth]);
  
  const filteredMasterEmployees = useMemo(() => {
    return masterEmployees.filter(emp => statusFilter === 'All' || emp.status === statusFilter);
  }, [masterEmployees, statusFilter]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-inter flex transition-colors duration-300">
      <Sidebar activeMenu={activeMenu} setActiveMenu={(menu) => dispatch(setActiveMenu(menu))} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* background gradient effects */}
        <div className="absolute inset-0 bg-black opacity-70 z-0 dark:visible invisible"></div>
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse-slow -z-1"></div>
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full filter blur-3xl animate-pulse-slow delay-2000 -z-1"></div>
        
        <div className="relative z-10 flex flex-col flex-1 p-4 sm:p-6 lg:p-8 bg-transparent dark:backdrop-blur-sm dark:bg-gray-900/30 overflow-hidden">
          <Header
            months={Object.keys(payrollDataByMonth).sort().reverse()}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            onAddEmployee={() => dispatch(setAddEmployeeModalOpen(true))}
            onAddMestri={() => dispatch(setAddMestriModalOpen(true))}
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => dispatch(setStatusFilter(status))}
            activeView={activeMenu}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            searchTerm={payrollSearch}
            onSearchChange={setPayrollSearch}
            onExport={() => {
              const rows = processedPayrollData.filter(e => {
                if (!payrollSearch) return true;
                const q = payrollSearch.toLowerCase();
                return (
                  e.name.toLowerCase().includes(q) ||
                  e.empId.toLowerCase().includes(q) ||
                  ((e as any).mestri?.name || '').toLowerCase().includes(q)
                );
              });
              exportPayrollToExcel(rows, payrollSearch ? `payroll_${currentMonth}_filtered` : `payroll_${currentMonth}_all`);
            }}
          />
          <div className="flex-1 flex flex-col overflow-hidden mt-4">
            {activeMenu === 'Payroll' && (
  <>
    {processedPayrollData.length === 0 ? (() => {
      const now = new Date();
      const [year, month] = currentMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1);
      if (selectedDate < new Date(now.getFullYear(), now.getMonth())) {
        // Past month, no data
        return (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-500 dark:text-gray-400">
            There is no data entered in this month.
          </div>
        );
      } else {
        // Current or future month, no data: show Import Employees button
        return (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-lg text-gray-500 dark:text-gray-400">
            <span>No payroll data for this month.</span>
            <button
              className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={importZeroedPayrollForMonth}
            >
              Import Employees for {currentMonth}
            </button>
          </div>
        );
      }
    })() : (
      <div className="flex-1 overflow-auto pr-2">
        <PayrollTable
          data={processedPayrollData.filter(e => {
            if (!payrollSearch) return true;
            const q = payrollSearch.toLowerCase();
            return (
              e.name.toLowerCase().includes(q) ||
              e.empId.toLowerCase().includes(q) ||
              ((e as any).mestri?.name || '').toLowerCase().includes(q)
            );
          })}
          onUpdateEmployee={handleUpdateEmployee}
        />
      </div>
    )}
  </>
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
      {isAddEmployeeModalOpen && (
        <AddEmployeeModal
          onClose={() => dispatch(setAddEmployeeModalOpen(false))}
          onAddEmployee={handleAddEmployee}
          mestriList={normalizedMestris}
        />
      )}
      {isAddMestriModalOpen && (
        <AddMestriModal
          onClose={() => dispatch(setAddMestriModalOpen(false))}
          onAddMestri={handleAddMestri}
        />
      )}
    </div>
  );
};

export default App;