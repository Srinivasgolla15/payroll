import React, { useState, useMemo, memo } from 'react';
import { Mestri } from '../src/types/firestore';

// Define MasterEmployee aligned with Employee (no dept, no bankCode)
type MasterEmployee = {
  empId: string;
  name: string;
  mestriId: string;
  perDayWage: number | string; // Allow string for empty input
  joiningDate: string;
  ifsc: string;
  bankHolderName: string;
  accountNumber: string;
  phoneNumber: string;
};

interface AddEmployeeModalProps {
  onClose: () => void;
  onAddEmployee: (employeeData: MasterEmployee) => void; // Include empId in payload
  mestriList: Mestri[];
}

type EmployeeFormData = MasterEmployee;

// Memoized InputField with strict typing
const InputField = memo(
  ({ label, name, type = 'text', value, required = true, onChange }: {
    label: string;
    name: keyof EmployeeFormData | string;
    type?: string;
    value: string | number;
    required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      />
    </div>
  )
);

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onAddEmployee, mestriList }) => {
  // Memoized initial form data
  const initialFormData = useMemo(() => ({
    empId: '',
    name: '',
    mestriId: mestriList.length > 0 ? mestriList[0].mestriId || mestriList[0].id : '',
    perDayWage: '' as string | number,
    joiningDate: '',
    ifsc: '',
    bankHolderName: '',
    accountNumber: '',
    phoneNumber: '',
  }), [mestriList]);

  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'perDayWage' ? (value === '' ? '' : parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AddEmployeeModal - Submitting form data:', formData);
    console.log('AddEmployeeModal - Selected mestriId:', formData.mestriId);
    onAddEmployee(formData);
  };

  // Memoized form validation
  const isFormValid = useMemo(() => {
    return (
      formData.empId.trim().length > 0 &&
      formData.name.trim().length > 0 &&
      formData.mestriId.trim().length > 0 &&
      (formData.perDayWage !== '' && parseFloat(formData.perDayWage as any) > 0) &&
      formData.joiningDate.trim().length > 0 &&
      formData.phoneNumber.trim().length > 0
    );
  }, [formData.empId, formData.name, formData.mestriId, formData.perDayWage, formData.joiningDate, formData.phoneNumber]);

  // Memoized input fields
  const inputFields = useMemo(() => [
    { label: 'Employee ID', name: 'empId', type: 'text', value: formData.empId, required: true },
    { label: 'Full Name', name: 'name', type: 'text', value: formData.name, required: true },
    { label: 'Per Day Wage (₹)', name: 'perDayWage', type: 'number', value: formData.perDayWage, required: true },
    { label: 'Joining Date', name: 'joiningDate', type: 'date', value: formData.joiningDate, required: true },
    { label: 'Phone Number', name: 'phoneNumber', type: 'text', value: formData.phoneNumber, required: true },
    { label: 'Bank Holder Name', name: 'bankHolderName', type: 'text', value: formData.bankHolderName, required: false },
    { label: 'Account Number', name: 'accountNumber', type: 'text', value: formData.accountNumber, required: false },
    { label: 'IFSC Code', name: 'ifsc', type: 'text', value: formData.ifsc, required: false },
  ], [formData.empId, formData.name, formData.perDayWage, formData.joiningDate, formData.phoneNumber, formData.bankHolderName, formData.accountNumber, formData.ifsc]);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        style={{ animation: 'modal-enter 0.3s ease-out forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Add New Employee</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter the details for the new employee.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputFields.map((field) => (
              <InputField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                value={field.value}
                required={field.required}
                onChange={handleChange}
              />
            ))}
            <div>
              <label htmlFor="mestriId" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mestri</label>
              <select
                id="mestriId"
                name="mestriId"
                value={formData.mestriId}
                onChange={handleChange}
                required
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none"
              >
                {mestriList.map(mestri => (
                  <option key={mestri.id} value={mestri.mestriId || mestri.id} className="bg-white dark:bg-slate-800">
                    {mestri.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600/80 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!isFormValid}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};