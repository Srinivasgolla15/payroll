import React, { useState, useEffect } from 'react';
import { PayrollData, Employee, EmployeeStatus, PaymentMethod } from '../src/types/firestore';

// Define PaymentStatus as a const object to use as both type and value
const PaymentStatus = {
  Paid: 'Paid',
  Unpaid: 'Unpaid',
  Partial: 'Partial'
} as const;

type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { isBefore, format } from 'date-fns';
import { saveLastEmployee } from '../services/lastEmployeeService';

interface ManualEmployeeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  onComplete: () => void;
}

interface EmployeeFormData extends Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  bankName?: string;
  employeeStatus: EmployeeStatus;
}

interface PayrollFormData {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  mestriId?: string;
  employeeId?: string;
  status?: PaymentStatus;
  empId: string;
  name: string;
  dept: string;
  bankHolderName: string;
  ifsc: string;
  bankName: string;
  accountNumber: string;
  phoneNumber?: string;
  employeeStatus: EmployeeStatus;
  joiningDate: string;
  month: string;
  duties: number;
  ot: number;
  ph: number;
  bus: number;
  food: number;
  eb: number;
  shoes: number;
  karcha: number;
  lastMonth: number;
  advance: number;
  cash: number;
  others: number;
  netSalary: number;
  totalSalary: number;
  salary: number;
  paid: boolean;
  deductions: number;
  perDayWage: number;
  dailyWage: number;
  totalDuties: number;
  otWages: number;
  balance: number;
  type: 'employee_payroll';
  year: string;
}

export const ManualEmployeeEntryModal: React.FC<ManualEmployeeEntryModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPastMonth, setIsPastMonth] = useState(true); // Assume past month by default

  // Employee form state
  const [employeeData, setEmployeeData] = useState<EmployeeFormData>({
    name: '',
    empId: '',
    dept: '',
    mestriId: '',
    phoneNumber: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    bankHolderName: '',
    perDayWage: 0,
    employeeStatus: EmployeeStatus.Active,
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Payroll form state
  const [payrollData, setPayrollData] = useState<PayrollFormData>({
    empId: '',
    name: '',
    dept: '',
    bankHolderName: '',
    ifsc: '',
    bankName: '',
    accountNumber: '',
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
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
    netSalary: 0,
    totalSalary: 0,
    salary: 0,
    paid: false,
    status: PaymentStatus.Unpaid,
    deductions: 0,
    perDayWage: 0,
    dailyWage: 0,
    totalDuties: 0,
    otWages: 0,
    balance: 0,
    type: 'employee_payroll',
    year: new Date().getFullYear().toString(),
    employeeStatus: EmployeeStatus.Active, // Add default employeeStatus
  });

  // Check if currentMonth is a past month
  useEffect(() => {
    if (!currentMonth) return;
    const selectedDate = new Date(currentMonth + '-01');
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    setIsPastMonth(isBefore(selectedDate, thisMonthStart));
  }, [currentMonth]);

  // Reset form when modal opens or month changes
  useEffect(() => {
    if (!isOpen) return;

    setEmployeeData({
      name: '',
      empId: '',
      dept: '',
      mestriId: '',
      phoneNumber: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
      bankHolderName: '',
      perDayWage: 0,
      employeeStatus: EmployeeStatus.Active,
      joiningDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setPayrollData(prev => ({
      ...prev,
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
      netSalary: 0,
      totalSalary: 0,
      salary: 0,
      paid: false,
      status: PaymentStatus.Unpaid,
    }));
  }, [isOpen, currentMonth]);

  // Handlers
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEmployeeData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handlePayrollChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = 'checked' in target ? target.checked : false;
    setPayrollData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value),
    }));
  };

  // Calculate totals on payroll changes
  useEffect(() => {
    const {
      duties,
      ot,
      advance,
      ph,
      bus,
      food,
      eb,
      shoes,
      karcha,
      lastMonth,
      cash,
      others,
    } = payrollData;
    const perDayWage = employeeData.perDayWage || 0;

    const salary = duties * perDayWage;
    const otWages = ot * perDayWage * 1.5;
    const totalSalary = salary + otWages;
    const deductions = advance + ph + bus + food + eb + shoes + karcha + lastMonth + cash + others;
    const netSalary = totalSalary - deductions;
    const balance = netSalary - cash;

    setPayrollData(prev => ({
      ...prev,
      salary,
      otWages,
      totalSalary,
      netSalary,
      balance,
      deductions,
    }));
  }, [
    payrollData.duties,
    payrollData.ot,
    payrollData.advance,
    payrollData.ph,
    payrollData.bus,
    payrollData.food,
    payrollData.eb,
    payrollData.shoes,
    payrollData.karcha,
    payrollData.lastMonth,
    payrollData.cash,
    payrollData.others,
    employeeData.perDayWage,
  ]);

  const saveEmployeeAndPayroll = async (employeeData: EmployeeFormData, payrollData: PayrollFormData) => {
    try {
      // Calculate any missing fields
      const otWages = (employeeData.perDayWage * 1.5 * payrollData.ot) || 0;
      const netSalary = payrollData.totalSalary - (payrollData.deductions || 0);
      const balance = netSalary - (payrollData.cash || 0);
      
      const completeData = {
        // Employee Data
        name: employeeData.name,
        empId: employeeData.empId,
        dept: employeeData.dept,
        phoneNumber: employeeData.phoneNumber || '',
        accountNumber: employeeData.accountNumber || '',
        ifsc: employeeData.ifsc || '',
        bankName: employeeData.bankName || '',
        bankHolderName: employeeData.bankHolderName || '',
        joiningDate: employeeData.joiningDate,
        perDayWage: employeeData.perDayWage,
        employeeStatus: employeeData.employeeStatus,
        
        // Payroll Data
        month: payrollData.month,
        duties: payrollData.duties,
        ot: payrollData.ot,
        ph: payrollData.ph || 0,
        bus: payrollData.bus || 0,
        food: payrollData.food || 0,
        eb: payrollData.eb || 0,
        shoes: payrollData.shoes || 0,
        karcha: payrollData.karcha || 0,
        lastMonth: payrollData.lastMonth || 0,
        advance: payrollData.advance || 0,
        cash: payrollData.cash || 0,
        others: payrollData.others || 0,
        salary: payrollData.salary || 0,
        totalSalary: payrollData.totalSalary || 0,
        netSalary,
        deductions: payrollData.deductions || 0,
        paid: payrollData.paid || false,
        status: (payrollData.status as PaymentStatus) || PaymentStatus.Unpaid,
        
        // Calculated Fields
        dailyWage: employeeData.perDayWage,
        totalDuties: payrollData.duties,
        otWages,
        balance,
        
        // Metadata
        type: 'employee_payroll' as const,
        year: new Date(payrollData.month + '-01').getFullYear().toString(),
      };
      
      // Save to Firestore using the service
      return await saveLastEmployee(completeData);
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save employee and payroll data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeData.name || !employeeData.empId || !employeeData.dept || !payrollData.month) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!isPastMonth) {
      toast.error('Payroll can only be added/edited for past months.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate any missing fields
      const otWages = (employeeData.perDayWage * 1.5 * payrollData.ot) || 0;
      const netSalary = payrollData.totalSalary - (payrollData.deductions || 0);
      const balance = netSalary - (payrollData.cash || 0);
      
      await saveEmployeeAndPayroll(employeeData, {
        ...payrollData,
        // Employee Data
        name: employeeData.name,
        empId: employeeData.empId,
        dept: employeeData.dept,
        phoneNumber: employeeData.phoneNumber || '',
        accountNumber: employeeData.accountNumber || '',
        ifsc: employeeData.ifsc || '',
        bankName: employeeData.bankName || '',
        bankHolderName: employeeData.bankHolderName || '',
        joiningDate: employeeData.joiningDate,
        perDayWage: employeeData.perDayWage,
        employeeStatus: employeeData.employeeStatus,
        
        // Payroll Data
        duties: payrollData.duties,
        ot: payrollData.ot,
        ph: payrollData.ph || 0,
        bus: payrollData.bus || 0,
        food: payrollData.food || 0,
        eb: payrollData.eb || 0,
        shoes: payrollData.shoes || 0,
        karcha: payrollData.karcha || 0,
        lastMonth: payrollData.lastMonth || 0,
        advance: payrollData.advance || 0,
        cash: payrollData.cash || 0,
        others: payrollData.others || 0,
        salary: payrollData.salary || 0,
        totalSalary: payrollData.totalSalary || 0,
        netSalary: netSalary,
        deductions: payrollData.deductions || 0,
        paid: payrollData.paid || false,
        status: (payrollData.status as PaymentStatus) || PaymentStatus.Unpaid,
        
        // Calculated Fields
        dailyWage: employeeData.perDayWage,
        totalDuties: payrollData.duties,
        otWages: otWages,
        balance: balance,
        
        // Metadata
        type: 'employee_payroll' as const,
        year: new Date(payrollData.month + '-01').getFullYear().toString(),
      });

      toast.success('Employee and payroll data saved successfully!');
      onComplete();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save data: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Add / Edit Employee Payroll</h2>
          <button onClick={onClose} className="text-blue-100 hover:text-white" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Month and Status */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white mb-6">
              <div className="flex items-center justify-between">
                <p className="text-blue-100">
                  {new Date(payrollData.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isPastMonth ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {isPastMonth ? 'Past Month' : 'Current/Future Month'}
                </span>
              </div>
              {!isPastMonth && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded text-sm">
                  <p>Note: Editing current or future month payroll is restricted.</p>
                </div>
              )}
            </div>

            {/* Employee Information */}
            <fieldset className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
              <legend className="px-2 text-lg font-semibold text-gray-700 dark:text-gray-200">Employee Information</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <InputField label="Employee Name" name="name" value={employeeData.name} onChange={handleEmployeeChange} required />
                <InputField label="Employee ID" name="empId" value={employeeData.empId} onChange={handleEmployeeChange} required />
                <InputField label="Department" name="dept" value={employeeData.dept} onChange={handleEmployeeChange} required />
                <InputField label="Phone Number" name="phoneNumber" value={employeeData.phoneNumber} onChange={handleEmployeeChange} />
                <InputField label="Bank Holder Name" name="bankHolderName" value={employeeData.bankHolderName} onChange={handleEmployeeChange} />
                <InputField label="Account Number" name="accountNumber" value={employeeData.accountNumber} onChange={handleEmployeeChange} />
                <InputField label="IFSC Code" name="ifsc" value={employeeData.ifsc} onChange={handleEmployeeChange} />
                <InputField label="Bank Name" name="bankName" value={employeeData.bankName} onChange={handleEmployeeChange} />
                <SelectField label="Employee Status" name="employeeStatus" value={employeeData.employeeStatus} onChange={handleEmployeeChange} options={Object.values(EmployeeStatus)} />
                <InputField label="Joining Date" name="joiningDate" value={employeeData.joiningDate} onChange={handleEmployeeChange} type="date" />
                <InputField label="Per Day Wage" name="perDayWage" value={employeeData.perDayWage} onChange={handleEmployeeChange} type="number" min="0" />
              </div>
            </fieldset>

            {/* Payroll Information */}
            <fieldset className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
              <legend className="px-2 text-lg font-semibold text-gray-700 dark:text-gray-200">Payroll Information</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <InputField label="Month" name="month" value={payrollData.month} onChange={handlePayrollChange} type="month" required />
                <InputField label="Duties" name="duties" value={payrollData.duties} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Overtime" name="ot" value={payrollData.ot} onChange={handlePayrollChange} type="number" min="0" step="0.5" />
                <InputField label="PH" name="ph" value={payrollData.ph} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Bus" name="bus" value={payrollData.bus} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Food" name="food" value={payrollData.food} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="EB" name="eb" value={payrollData.eb} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Shoes" name="shoes" value={payrollData.shoes} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Karcha" name="karcha" value={payrollData.karcha} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Last Month" name="lastMonth" value={payrollData.lastMonth} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Advance" name="advance" value={payrollData.advance} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Cash" name="cash" value={payrollData.cash} onChange={handlePayrollChange} type="number" min="0" />
                <InputField label="Others" name="others" value={payrollData.others} onChange={handlePayrollChange} type="number" min="0" />

                <InputField label="Basic Salary" name="salary" value={payrollData.salary?.toFixed(2) || '0.00'} readOnly />
                <InputField label="Total Salary" name="totalSalary" value={payrollData.totalSalary?.toFixed(2) || '0.00'} readOnly />
                <InputField label="Net Salary" name="netSalary" value={payrollData.netSalary?.toFixed(2) || '0.00'} readOnly />
                <InputField label="Balance" name="balance" value={payrollData.balance?.toFixed(2) || '0.00'} readOnly />

                <SelectField
                  label="Payment Status"
                  name="status"
                  value={payrollData.status || PaymentStatus.Unpaid}
                  onChange={handlePayrollChange}
                  options={Object.values(PaymentStatus)}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="paid"
                    checked={payrollData.paid || false}
                    onChange={handlePayrollChange}
                    id="paid-checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <label htmlFor="paid-checkbox">Mark as Paid</label>
                </div>
              </div>
            </fieldset>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isPastMonth}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Employee & Payroll'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
  readOnly = false,
}) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      readOnly={readOnly}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${readOnly ? 'cursor-not-allowed' : ''
        }`}
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | number)[];
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options }) => (
  <div className="space-y-1">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    >
      {options.map(option => (
        <option key={option.toString()} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// Component exported above
