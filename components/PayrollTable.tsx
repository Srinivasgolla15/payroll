import React, { useState, useEffect, useRef } from 'react';
import { Employee } from '../src/types/firestore';
import { LastEmployeeData } from '../services/lastEmployeeService';
import { PAYROLL_COLUMNS } from '../constants';
import { PayrollEditModal } from './PayrollEditModal';
import { PayrollInfoModal } from './PayrollInfoModal';
import { ImportFromPresentMonthModal } from './ImportFromPresentMonthModal';
import { ManualEmployeeEntryModal } from './ManualEmployeeEntryModal';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { fetchLastEmployees } from '../redux/slices/lastEmployeesSlice';

interface PayrollTableProps {
  data: LastEmployeeData[];
  currentMonth: string;
  onUpdateEmployee: (employee: LastEmployeeData) => void;
}

interface EditingCell {
  rowIndex: number;
  key: keyof LastEmployeeData | 'remarks';
}

export const PayrollTable: React.FC<PayrollTableProps> = ({ data, currentMonth, onUpdateEmployee }) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updatedCell, setUpdatedCell] = useState<EditingCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editRow, setEditRow] = useState<LastEmployeeData | null>(null);
  const [infoRow, setInfoRow] = useState<LastEmployeeData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const employees = useAppSelector(s => s.employees.masterList);
  const mestris = useAppSelector(s => s.mestri.list);
  
  const numericKeys = [
    'duties', 'ot', 'perDayWage', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha', 
    'lastMonth', 'advance', 'cash', 'others', 'salary', 'totalSalary', 'netSalary', 
    'deductions', 'dailyWage', 'totalDuties', 'otWages', 'balance'
  ] as const;

  const handleManualEntryComplete = () => {
    setShowManualEntryModal(false);
    // Re-fetch lastemployees for the month so newly added entries appear
    dispatch(fetchLastEmployees(currentMonth));
  };

  const handleInfo = (row: LastEmployeeData) => {
    setInfoRow(row);
  };

  const handleEdit = (row: LastEmployeeData) => {
    setEditRow(row);
  };

  // Check if there's no data for the current month
  // Filter data for the current month and ensure we have all required fields
  const filteredData = data
    .filter((item) => item.month === currentMonth)
    .map(item => ({
      ...item,
      // Ensure all required fields have default values
      duties: item.duties || 0,
      ot: item.ot || 0,
      perDayWage: item.perDayWage || 0,
      ph: item.ph || 0,
      bus: item.bus || 0,
      food: item.food || 0,
      eb: item.eb || 0,
      shoes: item.shoes || 0,
      karcha: item.karcha || 0,
      lastMonth: item.lastMonth || 0,
      advance: item.advance || 0,
      cash: item.cash || 0,
      others: item.others || 0,
      salary: item.salary || 0,
      totalSalary: item.totalSalary || 0,
      netSalary: item.netSalary || 0,
      deductions: item.deductions || 0,
      paid: item.paid || false,
      status: item.status || 'Unpaid',
      dailyWage: item.dailyWage || item.perDayWage || 0,
      totalDuties: item.totalDuties || ((item.duties || 0) + (item.ot || 0)),
      otWages: item.otWages || 0,
      balance: item.balance || 0,
      mestriId: item.mestriId || '',
      mestri: item.mestri || '',
      remarks: item.remarks || ''
    }));

  const hasNoData = filteredData.length === 0;

  // Fetch last employees when month changes
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchLastEmployees(currentMonth));
  }, [currentMonth, dispatch]);

  // Check if the current month is in the past
  const now = new Date();
  const [year, month] = currentMonth.split('-').map(Number);
  const selectedDate = new Date(year, month - 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth());
  const isPastMonth = selectedDate < currentDate;

  console.log(
    'PayrollTable - Current month:',
    currentMonth,
    'Has data:',
    !hasNoData,
    'Filtered data length:',
    filteredData.length,
    'Is past month:',
    isPastMonth
  );

  // Show import button if it's a past month with no data
  const showImportButton = isPastMonth && hasNoData;

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  useEffect(() => {
    if (updatedCell) {
      const timer = setTimeout(() => setUpdatedCell(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [updatedCell]);

  const calculateTotals = (data: LastEmployeeData) => {
    const duties = data.duties || 0;
    const ot = data.ot || 0;
    const perDayWage = data.perDayWage || 0;
    const ph = data.ph || 0;
    const bus = data.bus || 0;
    const food = data.food || 0;
    const eb = data.eb || 0;
    const shoes = data.shoes || 0;
    const karcha = data.karcha || 0;
    const lastMonth = data.lastMonth || 0;
    const advance = data.advance || 0;
    const others = data.others || 0;
    const mestriId = data.mestriId || '';

    const totalDuties = duties + ot;
    const salary = totalDuties * perDayWage + (ph * 497.65);
    const totalSalary = salary;
    const deductions = bus + food + eb + shoes + karcha + lastMonth + advance + others;
    const netSalary = totalSalary - deductions;
    const balance = netSalary - (data.cash || 0);

    return {
      totalDuties,
      salary,
      totalSalary,
      deductions,
      netSalary,
      balance,
      paid: balance <= 0,
      status: balance <= 0 ? 'Paid' : 'Unpaid' as const,
      otWages: (ot * perDayWage * 1.5) || 0,
      dailyWage: perDayWage,
    };
  };

  const handleUpdate = async () => {
    if (!editingCell) return;

    const { rowIndex, key } = editingCell;
    const row = filteredData[rowIndex];
    if (!row) return;

    try {
      // Only parse as number if the key is in numericKeys
      const isNumeric = numericKeys.includes(key as any);
      const value = isNumeric ? parseFloat(editValue) || 0 : editValue;

      // Create a new object with the updated value
      const updatedRow = { 
        ...row, 
        [key]: value,
        updatedAt: new Date().toISOString()
      } as LastEmployeeData;

      // Recalculate totals if needed
      if (isNumeric) {
        const totals = calculateTotals(updatedRow);
        Object.assign(updatedRow, totals);
      }

      // If we're updating the mestri field, we need to update the mestriId
      if (key === 'mestri') {
        // Resolve mestri by name using mestri slice
        const m = mestris.find((x: any) => x.name === value || x.mestriId === value || x.id === value);
        if (m) {
          updatedRow.mestriId = (m as any).mestriId || (m as any).id || '';
          (updatedRow as any).mestri = m.name;
        }
      }

      // Call the update function with the complete updated row
      await onUpdateEmployee(updatedRow);
      
      setEditingCell(null);
      setUpdatedCell(editingCell);
    } catch (error) {
      console.error('Error updating employee:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDoubleClick = (
    rowIndex: number,
    key: keyof LastEmployeeData | 'remarks',
    value: any
  ) => {
    const column = PAYROLL_COLUMNS.find((c) => c.key === key);
    if (column && column.editable) {
      setEditingCell({ rowIndex, key });
      setEditValue(
        column.isNumeric && value === 0 ? '' : String(value || '')
      );
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (event.key === 'Enter') {
      handleUpdate();
    } else if (event.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getEmployeeName = (empId: string | undefined | null): string => {
    if (!empId) return 'N/A';
    const employee = employees.find((e) => e.id === empId);
    return employee?.name || 'N/A';
  };

  const getMestriName = (mestriId: string | undefined | null): string => {
    if (!mestriId) return 'N/A';
    const m = mestris.find((x: any) => x.mestriId === mestriId || x.id === mestriId);
    return m?.name || mestriId;
  };

  const getStatusForEmployee = (emp: LastEmployeeData): string => {
    if (!emp) return 'Active';
    return emp.employeeStatus || 'Active';
  };

  const formatValue = (
    key: keyof LastEmployeeData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth' | 'remarks',
    value: any
  ) => {
    if (value === undefined || value === null) {
      if (
        [
          'duties',
          'ot',
          'totalDuties',
          'bus',
          'food',
          'eb',
          'shoes',
          'karcha',
          'lastMonth',
          'advance',
          'cash',
          'perDayWage',
          'totalSalary',
          'totalPayment',
          'balance',
        ].includes(key)
      ) {
        return '0';
      }
      if (key === 'remarks') return '';
      return '-';
    }
    if (
      [
        'salary',
        'otWages',
        'totalSalary',
        'netSalary',
        'balance',
        'advance',
        'pf',
        'esi',
        'tds',
        'others',
        'bonus',
        'cash',
        'bus',
        'food',
        'eb',
        'shoes',
        'karcha',
        'lastMonth',
        'perDayWage',
      ].includes(key)
    ) {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
      }).format(num);
    }
    if (key === 'ph') {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      return num.toString();
    }
    if (key === 'mestri') {
      if (typeof value === 'object' && value !== null) {
        return (value as any)?.name || (value as any)?.mestriId || '-';
      }
      return String(value || '-');
    }
    if (key === 'paid') return value ? 'Paid' : 'Unpaid';
    if (key === 'remarks') return value || '-';
    return String(value);
  };

  const handleImportComplete = () => {
    // Re-fetch lastemployees for the month so imported entries appear
    dispatch(fetchLastEmployees(currentMonth));
  };

  const handleImport = async (selectedEmployees: LastEmployeeData[]) => {
    try {
      // Add each selected employee to the last employees collection for the current month
      const importPromises = selectedEmployees.map(employee => {
        // Create a new employee record for the target month with zeroed payroll
        const newEmployee: LastEmployeeData = {
          ...employee,
          month: currentMonth,
          duties: 0,
          ot: 0,
          ph: 0,
          bus: 0,
          food: 0,
          eb: 0,
          shoes: 0,
          karcha: 0,
          lastMonth: 0,
          advance: 0,
          cash: 0,
          others: 0,
          salary: 0,
          totalSalary: 0,
          netSalary: 0,
          deductions: 0,
          paid: false,
          status: 'Unpaid',
          dailyWage: employee.perDayWage || 0,
          totalDuties: 0,
          otWages: 0,
          balance: 0,
          // Preserve the mestriId from the source employee
          mestriId: employee.mestriId || '',
          // Add type and year for filtering
          type: 'employee_payroll',
          year: currentMonth.split('-')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return onUpdateEmployee(newEmployee);
      });

      await Promise.all(importPromises);
      setShowImportModal(false);
      
      // Show success message or update UI as needed
      alert('Employees imported successfully!');
    } catch (error) {
      console.error('Error importing employees:', error);
      alert('Failed to import employees. Please try again.');
    }
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">
          Payroll for{' '}
          {new Date(currentMonth).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          })}
        </h2>
        <div className="flex flex-wrap gap-2">
          {showImportButton && (
            <>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center whitespace-nowrap text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import Payroll
              </button>
              <span className="text-gray-500 flex items-center">or</span>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowManualEntryModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center whitespace-nowrap text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white/60 dark:bg-gray-900/50 backdrop-blur-md border border-gray-300 dark:border-cyan-500/20 rounded-xl shadow-lg min-h-[200px]">
        <table className="w-full min-w-max text-sm text-left text-gray-600 dark:text-gray-300 table-auto">
          <thead className="text-xs text-cyan-800 dark:text-cyan-300 uppercase bg-gray-200/60 dark:bg-gray-800/60 sticky top-0 backdrop-blur-lg">
            <tr>
              {PAYROLL_COLUMNS.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className="px-4 py-3 whitespace-nowrap border-b border-r border-gray-300/50 dark:border-gray-700/50"
                >
                  {col.label}
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 whitespace-nowrap border-b border-r border-gray-300/50 dark:border-gray-700/50"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((employee, rowIndex) => (
              <tr
                key={employee.id || employee.empId || String(rowIndex)}
                className="bg-white/40 dark:bg-gray-800/40 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                {PAYROLL_COLUMNS.map((col) => {
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.key === col.key;
                  const value = (employee as any)[col.key] ?? (col.isNumeric ? 0 : col.key === 'remarks' ? '' : '-');
                  const isCalculated = !col.editable;
                  const isRecentlyUpdated = updatedCell?.rowIndex === rowIndex && updatedCell?.key === col.key;

                  return (
                    <td
                      key={`${employee.id || employee.empId || rowIndex}-${String(col.key)}`}
                      onDoubleClick={() => handleDoubleClick(rowIndex, col.key as keyof LastEmployeeData, value)}
                      className={`px-4 py-2 border-b border-r border-gray-300/50 dark:border-gray-700/50 whitespace-nowrap transition-all duration-1000 ${
                        col.isNumeric ? 'text-right' : 'text-left'
                      } ${col.editable ? 'cursor-pointer' : ''} ${
                        isCalculated ? 'text-cyan-700 dark:text-cyan-300 font-medium' : ''
                      } ${isRecentlyUpdated || (updatedCell && isCalculated && updatedCell.rowIndex === rowIndex) ? 'bg-green-500/20 dark:bg-green-500/30' : ''}`}
                    >
                      {isEditing ? (
                        col.key === 'paid' ? (
                          <select
                            aria-label="Paid status"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleUpdate}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white outline-none ring-2 ring-cyan-400 rounded px-1 py-0.5"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        ) : col.key === 'cashOrAccount' ? (
                          <select
                            aria-label="Cash or Account"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleUpdate}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white outline-none ring-2 ring-cyan-400 rounded px-1 py-0.5"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Account">Account</option>
                          </select>
                        ) : (
                          <input
                            ref={inputRef}
                            type={col.isNumeric ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => {
                              if (col.isNumeric) {
                                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                                  setEditValue(e.target.value);
                                }
                              } else {
                                setEditValue(e.target.value);
                              }
                            }}
                            onBlur={handleUpdate}
                            onKeyDown={handleKeyDown}
                            aria-label={`Edit ${String(col.key)}`}
                            placeholder={col.isNumeric ? '0' : `Edit ${String(col.key)}`}
                            className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white outline-none ring-2 ring-cyan-400 rounded px-1 py-0.5"
                            step={col.isNumeric ? 'any' : undefined}
                          />
                        )
                      ) : (
                        <span>
                          {col.key === 'sNo' 
                            ? rowIndex + 1 
                            : col.key === 'mestri'
                              ? getMestriName(employee.mestriId)
                              : col.key === 'status' 
                                ? getStatusForEmployee(employee) 
                                : formatValue(col.key as any, value)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td
                  className="px-4 py-2 border-b border-gray-300/50 dark:border-gray-700/50 whitespace-nowrap text-right"
                >
                  <button
                    className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 mr-2"
                    onClick={() => handleEdit(employee)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700"
                    onClick={() => setInfoRow(employee)}
                  >
                    Info
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ImportFromPresentMonthModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        currentMonth={currentMonth}
        onImportComplete={handleImportComplete}
      />
      {editRow && (
        <PayrollEditModal
          key={`edit-${editRow.id}`}
          row={editRow}
          onClose={() => {
            setEditRow(null);
          }}
          onSave={async (updatedEmployee) => {
            try {
              await onUpdateEmployee(updatedEmployee);
              setEditRow(null);
            } catch (error) {
              console.error('Error updating employee:', error);
            }
          }}
        />
      )}
      {showManualEntryModal && (
        <ManualEmployeeEntryModal
          isOpen={showManualEntryModal}
          onClose={() => setShowManualEntryModal(false)}
          currentMonth={currentMonth}
          onComplete={handleManualEntryComplete}
        />
      )}
      {infoRow && (
        <PayrollInfoModal
          row={infoRow}
          employee={employees.find((e: Employee) => e.empId === infoRow.empId) || null}
          onClose={() => setInfoRow(null)}
        />
      )}
    </div>
  );
};