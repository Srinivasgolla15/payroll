import React, { useState, useEffect, useRef } from 'react';
import { PayrollData, Employee } from '../src/types/firestore';
import { PAYROLL_COLUMNS } from '../constants';
import { PayrollEditModal } from './PayrollEditModal';
import { PayrollInfoModal } from './PayrollInfoModal';
import { useAppSelector } from '../redux/hooks';

interface PayrollTableProps {
  data: PayrollData[];
  onUpdateEmployee: (employee: PayrollData) => void;
}

interface EditingCell {
  rowIndex: number;
  key: keyof PayrollData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth' | 'remarks';
}

export const PayrollTable: React.FC<PayrollTableProps> = ({ data, onUpdateEmployee }) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updatedCell, setUpdatedCell] = useState<EditingCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editRow, setEditRow] = useState<PayrollData | null>(null);
  const [infoRow, setInfoRow] = useState<PayrollData | null>(null);
  const employees = useAppSelector(s => s.employees.masterList);

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

  const handleDoubleClick = (rowIndex: number, key: keyof PayrollData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth' | 'remarks', value: any) => {
    const column = PAYROLL_COLUMNS.find(c => c.key === key);
    if (column && column.editable) {
      setEditingCell({ rowIndex, key });
      setEditValue(column.isNumeric && value === 0 ? '' : String(value || ''));
    }
  };

  const handleUpdate = () => {
    if (!editingCell) return;

    const { rowIndex, key } = editingCell;
    const employeeToUpdate = data[rowIndex];
    const column = PAYROLL_COLUMNS.find(c => c.key === key);
    let newValue: string | number | boolean = editValue;

    if (column?.isNumeric) {
      newValue = editValue === '' ? 0 : parseFloat(editValue) || 0;
    } else if (key === 'paid') {
      newValue = editValue === 'paid';
    } else if (key === 'cashOrAccount') {
      newValue = editValue as 'Cash' | 'Account';
    } else if (key === 'remarks') {
      newValue = editValue;
    }

    if ((employeeToUpdate as any)[key] !== newValue) {
      const updatedEmployee = { ...employeeToUpdate, [key]: newValue } as PayrollData;
      onUpdateEmployee(updatedEmployee);
      setUpdatedCell(editingCell);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUpdate();
    } else if (event.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getEmployeeStatus = (empId: string | number | symbol | undefined | null): string => {
    if (empId === undefined || empId === null) return 'Active';
    const empIdStr = String(empId);
    const employee = employees.find((e: any) => e && String(e.empId) === empIdStr);
    return employee?.status || 'Active';
  };

  const getStatusForEmployee = (emp: PayrollData): string => {
    if (!emp) return 'Active';
    return getEmployeeStatus(emp.empId);
  };

  const formatValue = (key: keyof PayrollData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth' | 'remarks', value: any) => {
    if (value === undefined || value === null) {
      if (['duties', 'ot', 'totalDuties', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth', 'advance', 'cash', 'perDayWage', 'totalSalary', 'totalPayment', 'balance'].includes(key)) {
        return '0';
      }
      if (key === 'remarks') return '';
      return '-';
    }
    if (['salary', 'otWages', 'totalSalary', 'netSalary', 'balance', 'advance', 'pf', 'esi', 'tds', 'others', 'bonus', 'cash', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth', 'perDayWage'].includes(key)) {
      const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num);
    }
    if (key === 'mestri') {
      if (typeof value === 'object' && value !== null) return value.name || value.mestriId || '';
      return String(value || '');
    }
    if (key === 'paid') return value ? 'Paid' : 'Unpaid';
    if (key === 'remarks') return value || '-';
    return String(value);
  };

  return (
    <div className="overflow-x-auto bg-white/60 dark:bg-gray-900/50 backdrop-blur-md border border-gray-300 dark:border-cyan-500/20 rounded-xl shadow-lg">
      <table className="w-full min-w-max text-sm text-left text-gray-600 dark:text-gray-300 table-auto">
        <thead className="text-xs text-cyan-800 dark:text-cyan-300 uppercase bg-gray-200/60 dark:bg-gray-800/60 sticky top-0 backdrop-blur-lg">
          <tr>
            {PAYROLL_COLUMNS.map((col) => (
              <th key={String(col.key)} scope="col" className="px-4 py-3 whitespace-nowrap border-b border-r border-gray-300/50 dark:border-gray-700/50">
                {col.label}
              </th>
            ))}
            <th scope="col" className="px-4 py-3 whitespace-nowrap border-b border-r border-gray-300/50 dark:border-gray-700/50">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((employee, rowIndex) => (
            <tr key={employee.id || employee.empId || String(rowIndex)} className="bg-white/40 dark:bg-gray-800/40 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              {PAYROLL_COLUMNS.map((col) => {
                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.key === col.key;
                const value = (employee as any)[col.key] ?? (col.isNumeric ? 0 : col.key === 'remarks' ? '' : '-');
                const isCalculated = !col.editable;
                const isRecentlyUpdated = updatedCell?.rowIndex === rowIndex && updatedCell?.key === col.key;

                return (
                  <td
                    key={`${employee.id || employee.empId || rowIndex}-${String(col.key)}`}
                    onDoubleClick={() => handleDoubleClick(rowIndex, col.key as keyof PayrollData, value)}
                    className={`px-4 py-2 border-b border-r border-gray-300/50 dark:border-gray-700/50 whitespace-nowrap transition-all duration-1000 ${
                      col.isNumeric ? 'text-right' : 'text-left'
                    } ${col.editable ? 'cursor-pointer' : ''} ${
                      isCalculated ? 'text-cyan-700 dark:text-cyan-300 font-medium' : ''
                    } ${isRecentlyUpdated || (updatedCell && isCalculated && updatedCell.rowIndex === rowIndex) ? 'bg-green-500/20 dark:bg-green-500/30' : ''}`}
                  >
                    {isEditing ? (
                      col.key === 'paid' ? (
                        <select
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
                      <span>{col.key === 'status' ? getStatusForEmployee(employee) : formatValue(col.key, value)}</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-2 border-b border-gray-300/50 dark:border-gray-700/50 whitespace-nowrap text-right">
                <button
                  className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 mr-2"
                  onClick={() => setEditRow(employee)}
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
      {editRow && (
        <PayrollEditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={(updated) => { onUpdateEmployee(updated); setEditRow(null); }}
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