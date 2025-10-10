import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Employee } from '../src/types/firestore';
import { LastEmployeeData } from '../services/lastEmployeeService';
import { PAYROLL_COLUMNS } from '../constants';
import { PayrollEditModal } from './PayrollEditModal';
import { PayrollInfoModal } from './PayrollInfoModal';
import { ImportFromPresentMonthModal } from './ImportFromPresentMonthModal';
import { ManualEmployeeEntryModal } from './ManualEmployeeEntryModal';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { fetchLastEmployees } from '../redux/slices/lastEmployeesSlice';
import { LoadingSpinner, LoadingButton, Skeleton } from './ui';
import { FiEdit2, FiCheck, FiX, FiSave } from 'react-icons/fi';

interface PayrollTableProps {
  data: LastEmployeeData[];
  currentMonth: string;
  onUpdateEmployee: (employee: LastEmployeeData) => void;
  searchTerm?: string;
}

interface EditingCell {
  rowIndex: number;
  key: keyof LastEmployeeData | 'remarks';
}

export const PayrollTable: React.FC<PayrollTableProps> = ({ 
  data, 
  currentMonth, 
  onUpdateEmployee,
  searchTerm = ''
}) => {
  // State management
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedCell, setSavedCell] = useState<EditingCell | null>(null);
  const [errorCell, setErrorCell] = useState<EditingCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number }>({
    rowIndex: 0,
    colIndex: 0,
  });
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, LastEmployeeData>>(new Map());

  // Additional state for modals
  const [editRow, setEditRow] = useState<LastEmployeeData | null>(null);
  const [infoRow, setInfoRow] = useState<LastEmployeeData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const tableFocusRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isCommittingRef = useRef(false);

  // Redux
  const dispatch = useAppDispatch();
  const employees = useAppSelector(s => s.employees.masterList);
  const mestris = useAppSelector(s => s.mestri.list);

  // Constants
  const numericKeys = [
    'duties', 'ot', 'perDayWage', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha',
    'lastMonth', 'advance', 'cash', 'others', 'salary', 'totalSalary', 'netSalary',
    'deductions', 'dailyWage', 'totalDuties', 'otWages', 'balance'
  ] as const;

  const firstEditableColIndex = PAYROLL_COLUMNS.findIndex(c => c.editable);

  // Data processing with search
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // First filter by month
        if (item.month !== currentMonth) return false;

        // Then apply search filter if searchTerm exists
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();

        // Safe string conversion for search fields
        const name = (item.name?.toString() || '').toLowerCase();
        const empId = (item.empId?.toString() || '').toLowerCase();
        const mestri = (item.mestri?.toString() || '').toLowerCase();

        return name.includes(search) ||
               empId.includes(search) ||
               mestri.includes(search);
      })
      .map(item => ({
        ...item,
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
  }, [data, currentMonth, searchTerm]);

  // Initialize selectedCell to first editable column
  useEffect(() => {
    setSelectedCell({
      rowIndex: 0,
      colIndex: Math.max(0, firstEditableColIndex),
    });
  }, [firstEditableColIndex]);

  // Focus management
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      } else {
        // Select all text in input for numeric fields
        const input = inputRef.current as HTMLInputElement;
        input.select();
      }
    }
  }, [editingCell]);

  // Auto-focus table for keyboard navigation
  useEffect(() => {
    if (tableFocusRef.current && !editingCell) {
      tableFocusRef.current.focus();
    }
  }, [editingCell]);

  // Clear success/error indicators
  useEffect(() => {
    if (savedCell) {
      const timer = setTimeout(() => setSavedCell(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [savedCell]);

  useEffect(() => {
    if (errorCell) {
      const timer = setTimeout(() => setErrorCell(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorCell]);

  // Scroll selected cell into view
  useEffect(() => {
    const key = `${selectedCell.rowIndex}:${selectedCell.colIndex}`;
    const el = cellRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [selectedCell]);

  // Keep selection within bounds
  useEffect(() => {
    setSelectedCell(prev => {
      const maxRow = Math.max(0, filteredData.length - 1);
      const maxCol = Math.max(0, PAYROLL_COLUMNS.length - 1);
      return {
        rowIndex: Math.min(prev.rowIndex, maxRow),
        colIndex: Math.min(prev.colIndex, maxCol),
      };
    });
  }, [filteredData.length]);

  // Fetch employees on month change
  useEffect(() => {
    dispatch(fetchLastEmployees(currentMonth));
  }, [currentMonth, dispatch]);

  // Clear optimistic updates when data reflects changes
  useEffect(() => {
    if (optimisticUpdates.size === 0) return;
    const next = new Map(optimisticUpdates);
    let changed = false;
    filteredData.forEach(row => {
      const key = String(row.id || row.empId || '');
      const opt = next.get(key);
      if (opt && row.updatedAt && opt.updatedAt && row.updatedAt >= opt.updatedAt) {
        next.delete(key);
        changed = true;
      }
    });
    if (changed) setOptimisticUpdates(next);
  }, [filteredData, optimisticUpdates]);

  // Calculations
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

  // Cell editing functions
  const startEditing = useCallback((
    rowIndex: number, 
    key: keyof LastEmployeeData | 'remarks', 
    initialChar?: string
  ) => {
    if (isCommittingRef.current) return;

    const row = filteredData[rowIndex];
    if (!row) return;

    const column = PAYROLL_COLUMNS.find(col => col.key === key);
    if (!column || !column.editable) return;

    // Reset editValue to handle new input correctly
    let editValue: string = '';
    if (initialChar) {
      if (column.isNumeric && /^[0-9]$/.test(initialChar)) {
        editValue = initialChar;
      } else if (!column.isNumeric) {
        editValue = initialChar;
      }
    } else {
      const currentValue = (row as any)[key];
      editValue = column.isNumeric && currentValue === 0 ? '' : String(currentValue || '');
    }

    setEditingCell({ rowIndex, key });
    setEditValue(editValue);
    setSelectedCell({ rowIndex, colIndex: PAYROLL_COLUMNS.findIndex(c => c.key === key) });
  }, [filteredData]);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveCurrentEdit = useCallback(async (): Promise<boolean> => {
    if (!editingCell || isCommittingRef.current) return true;

    isCommittingRef.current = true;
    setIsSaving(true);

    try {
      const { rowIndex, key } = editingCell;
      const row = filteredData[rowIndex];
      if (!row) return false;

      // Process value based on type
      const isNumeric = numericKeys.includes(key as any);
      let value: any = isNumeric ? parseFloat(editValue) || 0 : editValue;
      
      if (key === 'paid') {
        value = editValue === 'true' || editValue === 'Paid';
      }

      // Create updated row
      const updatedRow = {
        ...row,
        [key]: value,
        updatedAt: new Date().toISOString()
      } as LastEmployeeData;

      // Recalculate totals if numeric field
      if (isNumeric) {
        const totals = calculateTotals(updatedRow);
        Object.assign(updatedRow, totals);
      }

      // Handle mestri field specially
      if (key === 'mestri') {
        const mestri = mestris.find((m: any) => 
          m.name === value || m.mestriId === value || m.id === value
        );
        if (mestri) {
          updatedRow.mestriId = (mestri as any).mestriId || (mestri as any).id || '';
          (updatedRow as any).mestri = mestri.name;
        }
      }

      // Save to database
      await onUpdateEmployee(updatedRow);

      // Update optimistic state
      const rowKey = String(updatedRow.id || updatedRow.empId || `${rowIndex}`);
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.set(rowKey, updatedRow);
        return next;
      });

      // Show success feedback
      setSavedCell(editingCell);
      setEditingCell(null);
      setEditValue('');

      return true;
    } catch (error) {
      console.error('Error saving cell:', error);
      setErrorCell(editingCell);
      return false;
    } finally {
      setIsSaving(false);
      isCommittingRef.current = false;
    }
  }, [editingCell, editValue, filteredData, onUpdateEmployee, mestris, numericKeys, calculateTotals]);

  // Navigation functions
  const moveSelection = useCallback((dRow: number, dCol: number) => {
    setSelectedCell(prev => {
      const maxRow = Math.max(0, filteredData.length - 1);
      const maxCol = Math.max(0, PAYROLL_COLUMNS.length - 1);
      
      let newRow = Math.max(0, Math.min(prev.rowIndex + dRow, maxRow));
      let newCol = Math.max(0, Math.min(prev.colIndex + dCol, maxCol));

      // Skip non-editable columns when moving horizontally
      if (dCol !== 0) {
        const direction = Math.sign(dCol);
        while (newCol >= 0 && newCol <= maxCol) {
          const column = PAYROLL_COLUMNS[newCol];
          if (column && column.editable) break;
          newCol += direction;
        }
        // If no editable column found, stay at current position
        if (newCol < 0 || newCol > maxCol) {
          newCol = prev.colIndex;
        }
      }

      return { rowIndex: newRow, colIndex: newCol };
    });
  }, [filteredData.length]);

  const saveAndMove = useCallback(async (dRow: number, dCol: number) => {
    const saved = await saveCurrentEdit();
    if (saved) {
      moveSelection(dRow, dCol);
    }
  }, [saveCurrentEdit, moveSelection]);

  // Event handlers
  const handleCellClick = useCallback((
    rowIndex: number,
    colKey: keyof LastEmployeeData | 'remarks',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const column = PAYROLL_COLUMNS.find(c => c.key === colKey);
    if (!column) return;

    const colIndex = PAYROLL_COLUMNS.findIndex(c => c.key === colKey);
    
    // If currently editing another cell, save it first
    if (editingCell && (editingCell.rowIndex !== rowIndex || editingCell.key !== colKey)) {
      saveCurrentEdit().then(() => {
        setSelectedCell({ rowIndex, colIndex });
        if (column.editable) {
          startEditing(rowIndex, colKey);
        }
      });
      return;
    }

    setSelectedCell({ rowIndex, colIndex });
    
    // Start editing immediately if editable
    if (column.editable) {
      startEditing(rowIndex, colKey);
    }
  }, [editingCell, saveCurrentEdit, startEditing]);

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        saveAndMove(1, 0); // Move down like Excel
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          saveAndMove(0, -1); // Move left
        } else {
          saveAndMove(0, 1); // Move right
        }
        break;
      case 'Escape':
        event.preventDefault();
        cancelEditing();
        if (tableFocusRef.current) {
          tableFocusRef.current.focus();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        saveAndMove(1, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        saveAndMove(-1, 0);
        break;
      case 'ArrowLeft':
        // Only move if cursor is at beginning
        if ((event.target as HTMLInputElement).selectionStart === 0) {
          event.preventDefault();
          saveAndMove(0, -1);
        }
        break;
      case 'ArrowRight':
        // Only move if cursor is at end
        const input = event.target as HTMLInputElement;
        if (input.selectionStart === input.value.length) {
          event.preventDefault();
          saveAndMove(0, 1);
        }
        break;
    }
  }, [saveAndMove, cancelEditing]);

  const handleTableKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (editingCell) return; // Let input handler manage when editing

    const column = PAYROLL_COLUMNS[selectedCell.colIndex];
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveSelection(1, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveSelection(-1, 0);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveSelection(0, -1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveSelection(0, 1);
        break;
      case 'Enter':
      case 'F2':
        event.preventDefault();
        if (column && column.editable) {
          startEditing(selectedCell.rowIndex, column.key as keyof LastEmployeeData);
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (column && column.editable) {
          startEditing(selectedCell.rowIndex, column.key as keyof LastEmployeeData, '');
        }
        break;
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          moveSelection(0, -1);
        } else {
          moveSelection(0, 1);
        }
        break;
      default:
        // Handle printable characters
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          if (column && column.editable) {
            event.preventDefault();
            startEditing(selectedCell.rowIndex, column.key as keyof LastEmployeeData, event.key);
          }
        }
        break;
    }
  }, [editingCell, selectedCell, moveSelection, startEditing]);

  // Utility functions
  const getEmployeeName = (empId: string | undefined | null): string => {
    if (!empId) return 'N/A';
    const employee = employees.find((e) => e.id === empId);
    return employee?.name || 'N/A';
  };

  const getMestriName = (mestriId: string | undefined | null): string => {
    if (!mestriId) return 'N/A';
    const mestri = mestris.find((x: any) => x.mestriId === mestriId || x.id === mestriId);
    return mestri?.name || mestriId;
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
      const numericFields = [
        'duties', 'ot', 'totalDuties', 'bus', 'food', 'eb', 'shoes', 'karcha',
        'lastMonth', 'advance', 'cash', 'perDayWage', 'totalSalary', 'totalPayment', 'balance',
      ];
      if (numericFields.includes(key)) return '0';
      if (key === 'remarks') return '';
      return '-';
    }

    const currencyFields = [
      'salary', 'otWages', 'totalSalary', 'netSalary', 'balance', 'advance', 'pf', 'esi', 'tds',
      'others', 'bonus', 'cash', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth', 'perDayWage',
    ];

    if (currencyFields.includes(key)) {
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

  // Modal handlers
  const handleManualEntryComplete = () => {
    setShowManualEntryModal(false);
    dispatch(fetchLastEmployees(currentMonth));
  };

  const handleInfo = (row: LastEmployeeData) => {
    setInfoRow(row);
  };

  const handleEdit = (row: LastEmployeeData) => {
    setEditRow(row);
  };

  const handleImportComplete = () => {
    dispatch(fetchLastEmployees(currentMonth));
    setShowImportModal(false);
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

  // Check data availability
  const hasNoData = filteredData.length === 0;
  const now = new Date();
  const [year, month] = currentMonth.split('-').map(Number);
  const selectedDate = new Date(year, month - 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth());
  const isPastMonth = selectedDate < currentDate;
  const showImportButton = isPastMonth && hasNoData;

  // Render cell content
  const renderCellContent = (
    employee: LastEmployeeData,
    col: any,
    rowIndex: number,
    isEditing: boolean
  ) => {
    const rowKey = String(employee.id || employee.empId || '');
    const displayRow = optimisticUpdates.get(rowKey) || employee;
    const value = (displayRow as any)[col.key] ?? (col.isNumeric ? 0 : col.key === 'remarks' ? '' : '-');

    if (isEditing) {
      if (col.key === 'paid') {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue === 'true' ? 'true' : 'false'}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveCurrentEdit}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-inherit outline-none border border-cyan-400/60 focus:border-cyan-400 rounded px-2 py-1"
          >
            <option value="false">Unpaid</option>
            <option value="true">Paid</option>
          </select>
        );
      } else if (col.key === 'cashOrAccount') {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveCurrentEdit}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-inherit outline-none border border-cyan-400/60 focus:border-cyan-400 rounded px-2 py-1"
          >
            <option value="Cash">Cash</option>
            <option value="Account">Account</option>
          </select>
        );
      } else if (col.key === 'mestri') {
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveCurrentEdit}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-inherit outline-none border border-cyan-400/60 focus:border-cyan-400 rounded px-2 py-1"
          >
            <option value="">Select Mestri</option>
            {mestris.map((mestri: any) => (
              <option key={mestri.mestriId || mestri.id} value={mestri.name}>
                {mestri.name}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text" // Changed to text for better control
          inputMode={col.isNumeric ? 'decimal' : undefined}
          value={editValue}
          onChange={(e) => {
            if (col.isNumeric) {
              const newVal = e.target.value;
              // Allow empty string or valid numeric input (digits and optional decimal)
              if (newVal === '' || /^\d*\.?\d*$/.test(newVal)) {
                setEditValue(newVal);
              }
            } else {
              setEditValue(e.target.value);
            }
          }}
          onBlur={saveCurrentEdit}
          onKeyDown={handleInputKeyDown}
          className="w-full bg-transparent text-inherit outline-none border border-cyan-400/60 focus:border-cyan-400 rounded px-2 py-1"
          placeholder={col.isNumeric ? '0' : `Edit ${col.key}`}
        />
      );
    }

    // Display formatted value
    if (col.key === 'sNo') return rowIndex + 1;
    if (col.key === 'mestri') return getMestriName(employee.mestriId);
    if (col.key === 'status') return getStatusForEmployee(employee);
    return formatValue(col.key as any, value);
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

      <div
        ref={tableFocusRef}
        tabIndex={0}
        onKeyDown={handleTableKeyDown}
        className="overflow-x-auto bg-white/60 dark:bg-gray-900/50 backdrop-blur-md border border-gray-300 dark:border-cyan-500/20 rounded-xl shadow-lg min-h-[200px] focus:outline-none"
      >
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
                  const rowKey = String(employee.id || employee.empId || '');
                  const displayRow = optimisticUpdates.get(rowKey) || employee;
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.key === col.key;
                  const value = (displayRow as any)[col.key] ?? (col.isNumeric ? 0 : col.key === 'remarks' ? '' : '-');
                  const isCalculated = !col.editable;
                  const isRecentlyUpdated = savedCell?.rowIndex === rowIndex && savedCell?.key === col.key;
                  const colIndex = PAYROLL_COLUMNS.findIndex(c => c.key === col.key);
                  const isSelected = selectedCell.rowIndex === rowIndex && selectedCell.colIndex === colIndex;

                  return (
                    <td
                      key={`${employee.id || employee.empId || rowIndex}-${String(col.key)}`}
                      onMouseDown={(e) => handleCellClick(rowIndex, col.key as keyof LastEmployeeData, e)}
                      ref={(el) => {
                        const key = `${rowIndex}:${colIndex}`;
                        if (el) cellRefs.current.set(key, el as HTMLElement);
                        else cellRefs.current.delete(key);
                      }}
                      className={`px-4 py-2 border-b border-r border-gray-300/50 dark:border-gray-700/50 whitespace-nowrap transition-all duration-1000 ${
                        col.isNumeric ? 'text-right' : 'text-left'
                      } ${col.editable ? 'cursor-pointer' : ''} ${
                        isCalculated ? 'text-cyan-700 dark:text-cyan-300 font-medium' : ''
                      } ${isRecentlyUpdated || (savedCell && isCalculated && savedCell.rowIndex === rowIndex) ? 'bg-green-500/20 dark:bg-green-500/30' : ''} ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {renderCellContent(employee, col, rowIndex, isEditing)}
                        </div>
                        {isSaving && isEditing && (
                          <FiSave className="ml-2 animate-spin text-cyan-500" size={14} />
                        )}
                        {isRecentlyUpdated && (
                          <FiCheck className="ml-2 text-green-500" size={14} />
                        )}
                        {errorCell?.rowIndex === rowIndex && errorCell?.key === col.key && (
                          <FiX className="ml-2 text-red-500" size={14} />
                        )}
                      </div>
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
                    onClick={() => handleInfo(employee)}
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