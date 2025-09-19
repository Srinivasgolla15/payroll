import React, { useMemo, useState, memo } from 'react';
import { Employee, Mestri, EmployeeStatus } from '../src/types/firestore';
import { useAppSelector } from '../redux/hooks';

interface EditEmployeeModalProps {
  employee: Employee;
  mestriList: Mestri[];
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

type FormData = {
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

const InputField = memo(({ label, name, type = 'text', value, required = true, onChange, disabled = false }: {
  label: string;
  name: keyof FormData | string;
  type?: string;
  value: string | number;
  required?: boolean;
  disabled?: boolean;
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
      disabled={disabled}
      className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:opacity-60"
    />
  </div>
));

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, mestriList, onClose, onSave }) => {
  const initialForm = useMemo<FormData>(() => ({
    empId: employee.empId,
    name: employee.name,
    mestriId: employee.mestriId,
    perDayWage: employee.perDayWage || 0,
    joiningDate: employee.joiningDate || '',
    ifsc: employee.ifsc || '',
    bankHolderName: employee.bankHolderName || '',
    accountNumber: employee.accountNumber || '',
    phoneNumber: employee.phoneNumber || '',
  }), [employee]);

  const [form, setForm] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<Employee['status']>(employee.status || EmployeeStatus.Active);
  const mestris = useAppSelector(s => s.mestri.list) as unknown as Mestri[];

  const isValid = useMemo(() => (
    form.empId.trim() && form.name.trim() && form.mestriId.trim() && form.joiningDate.trim()
  ), [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: name === 'perDayWage' ? (value === '' ? '' : parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Employee = {
      ...employee,
      empId: form.empId,
      name: form.name,
      mestriId: form.mestriId,
      perDayWage: Number(form.perDayWage) || 0,
      joiningDate: form.joiningDate,
      ifsc: form.ifsc,
      bankHolderName: form.bankHolderName,
      accountNumber: form.accountNumber,
      phoneNumber: form.phoneNumber,
      status,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Edit Employee</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Employee ID" name="empId" type="text" value={form.empId} onChange={handleChange} required disabled />
            <InputField label="Full Name" name="name" type="text" value={form.name} onChange={handleChange} required />
            <InputField label="Per Day Wage (₹)" name="perDayWage" type="number" value={form.perDayWage} onChange={handleChange} required />
            <InputField label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} required />
            <InputField label="Phone Number" name="phoneNumber" type="text" value={form.phoneNumber} onChange={handleChange} required />
            <InputField label="Bank Holder Name" name="bankHolderName" type="text" value={form.bankHolderName} onChange={handleChange} required={false} />
            <InputField label="Account Number" name="accountNumber" type="text" value={form.accountNumber} onChange={handleChange} required={false} />
            <InputField label="IFSC Code" name="ifsc" type="text" value={form.ifsc} onChange={handleChange} required={false} />
            <div>
              <label htmlFor="mestriId" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mestri</label>
              <select
                id="mestriId"
                name="mestriId"
                value={form.mestriId}
                onChange={handleChange}
                required
                className="w-full bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none"
              >
                {(mestris.length ? mestris : mestriList).map(mestri => (
                  <option key={mestri.id} value={mestri.mestriId || mestri.id} className="bg-white dark:bg-slate-800">
                    {mestri.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
              <div className="inline-flex items-center rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setStatus(EmployeeStatus.Active)}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    status === EmployeeStatus.Active
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(EmployeeStatus.Left)}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    status === EmployeeStatus.Left
                      ? 'bg-red-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  Left
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600/80 transition-colors">Cancel</button>
            <button type="submit" disabled={!isValid} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};


