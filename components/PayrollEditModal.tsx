import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LastEmployeeData } from '../services/lastEmployeeService';
import { getMestris } from '../services/firebase';
import { Mestri } from '../src/types/firestore';
import { useAppSelector } from '../redux/hooks';

// Define local enums to avoid importing from firestore types
enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Partial = 'Partial'
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'upi';

interface PayrollEditModalProps {
  row: LastEmployeeData;
  onClose: () => void;
  onSave: (updated: LastEmployeeData) => void;
}

export const PayrollEditModal: React.FC<PayrollEditModalProps> = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState<LastEmployeeData>(() => ({
    ...row,
    duties: row.duties ?? 0,
    ot: row.ot ?? 0,
    perDayWage: row.perDayWage ?? 0,
    advance: row.advance ?? 0,
    ph: row.ph ?? 0,
    bus: row.bus ?? 0,
    food: row.food ?? 0,
    eb: row.eb ?? 0,
    shoes: row.shoes ?? 0,
    karcha: row.karcha ?? 0,
    lastMonth: row.lastMonth ?? 0,
    cash: row.cash ?? 0,
    others: row.others ?? 0,
    salary: row.salary ?? 0,
    totalSalary: row.totalSalary ?? 0,
    netSalary: row.netSalary ?? 0,
    deductions: row.deductions ?? 0,
    paid: row.paid ?? false,
    status: row.status ?? 'Unpaid',
    dailyWage: row.dailyWage ?? 0,
    totalDuties: row.totalDuties ?? 0,
    otWages: row.otWages ?? 0,
    balance: row.balance ?? 0,
    accountNumber: row.accountNumber ?? "",
    ifsc: row.ifsc ?? "",
    bankHolderName: row.bankHolderName ?? "",
    bankName: row.bankName ?? "",
    mestri: typeof row.mestri === 'object' && row.mestri !== null
      ? (row.mestri as any)?.name || (row.mestri as any)?.mestriId || ""
      : String(row.mestri || ""),
    mestriId: (row as any).mestriId || "",
    remarks: (row as any).remarks || "",
    cashOrAccount: row.cashOrAccount ?? "Cash",
  }));

  // Add state for mestris dropdown
  const [mestris, setMestris] = useState<Mestri[]>([]);
  const [mestrisLoading, setMestrisLoading] = useState(false);

  // Fetch mestris on component mount
  useEffect(() => {
    const fetchMestris = async () => {
      setMestrisLoading(true);
      try {
        const mestriList = await getMestris();
        setMestris(mestriList);
      } catch (error) {
        console.error('Error fetching mestris:', error);
      } finally {
        setMestrisLoading(false);
      }
    };

    fetchMestris();
  }, []);

  const numericKeys: (keyof LastEmployeeData)[] = useMemo(() => [
    'duties', 'ot', 'advance', 'cash', 'perDayWage', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth', 'others', 'salary', 'totalSalary', 'netSalary', 'deductions', 'dailyWage', 'totalDuties', 'otWages', 'balance'
  ] as const, []);

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
      dailyWage: perDayWage
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setForm(prev => {
      const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleMestriChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMestriId = e.target.value;
    const selectedMestri = mestris.find(m => m.mestriId === selectedMestriId);

    setForm(prev => ({
      ...prev,
      mestriId: selectedMestriId,
      mestri: selectedMestri ? selectedMestri.name : selectedMestriId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure all numeric fields are properly converted to numbers
    const updatedForm: LastEmployeeData = {
      ...form,
      duties: Number(form.duties) || 0,
      ot: Number(form.ot) || 0,
      perDayWage: Number(form.perDayWage) || 0,
      advance: Number(form.advance) || 0,
      ph: Number(form.ph) || 0,
      bus: Number(form.bus) || 0,
      food: Number(form.food) || 0,
      eb: Number(form.eb) || 0,
      shoes: Number(form.shoes) || 0,
      karcha: Number(form.karcha) || 0,
      lastMonth: Number(form.lastMonth) || 0,
      cash: Number(form.cash) || 0,
      others: Number(form.others) || 0,
      salary: Number(form.salary) || 0,
      totalSalary: Number(form.totalSalary) || 0,
      netSalary: Number(form.netSalary) || 0,
      deductions: Number(form.deductions) || 0,
      dailyWage: Number(form.dailyWage) || 0,
      totalDuties: Number(form.totalDuties) || 0,
      otWages: Number(form.otWages) || 0,
      balance: Number(form.balance) || 0,
      paid: form.balance ? form.balance <= 0 : false,
      status: form.balance ? (form.balance <= 0 ? 'Paid' : 'Unpaid') : 'Unpaid',
      // Ensure mestriId is included
      mestriId: form.mestriId || '',
      remarks: form.remarks || '',
    };
    onSave(updatedForm);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Payroll Details</h2>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="empId" className="block text-sm font-medium text-slate-700">Employee ID</label>
                <input
                  type="text"
                  id="empId"
                  name="empId"
                  value={form.empId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="dept" className="block text-sm font-medium text-slate-700">Department</label>
                <input
                  type="text"
                  id="dept"
                  name="dept"
                  value={form.dept}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="perDayWage" className="block text-sm font-medium text-slate-700">Daily Wage (₹)</label>
                <input
                  type="number"
                  id="perDayWage"
                  name="perDayWage"
                  value={form.perDayWage ?? ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Attendance & Earnings</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label htmlFor="duties" className="block text-sm font-medium text-slate-700">
                    DUTIES
                  </label>
                  <input
                    type="number"
                    id="duties"
                    name="duties"
                    value={form.duties ?? 0}
                    onChange={handleChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    min="0"
                    step="0.5"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ot" className="block text-sm font-medium text-slate-700">
                    OT
                  </label>
                  <input
                    type="number"
                    id="ot"
                    name="ot"
                    value={form.ot ?? 0}
                    onChange={handleChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    min="0"
                    step="0.5"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="ph" className="block text-sm font-medium text-slate-700">
                    PH
                  </label>
                  <input
                    type="number"
                    id="ph"
                    name="ph"
                    value={form.ph ?? 0}
                    onChange={handleChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    min="0"
                    step="1"
                    className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Total</label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 text-sm text-gray-900 rounded-md border border-gray-200">
                    {form.totalDuties}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['advance', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth'].map((k) => (
                  <div key={k} className="space-y-1">
                    <label htmlFor={k} className="block text-sm font-medium text-slate-700">
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </label>
                    <input
                      type="number"
                      id={k}
                      name={k}
                      value={(form as any)[k] ?? ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Total Deductions</label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 text-sm text-gray-900 rounded-md border border-gray-200">
                    {form.deductions}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Payment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Earnings</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">₹{form.totalSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deductions</p>
                  <p className="mt-1 text-lg font-bold text-rose-600">-₹{form.deductions?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Payable</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600">₹{form.netSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="cash" className="block text-sm font-medium text-slate-700">Cash Paid (₹)</label>
                <input
                  type="number"
                  id="cash"
                  name="cash"
                  value={form.cash ?? ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="mestri" className="block text-sm font-medium text-slate-700">Mestri</label>
                <select
                  id="mestri"
                  name="mestri"
                  value={form.mestriId || ''}
                  onChange={handleMestriChange}
                  disabled={mestrisLoading}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Mestri</option>
                  {mestris.map((mestri) => (
                    <option key={mestri.mestriId} value={mestri.mestriId}>
                      {mestri.name}  
                    </option>
                  ))}
                </select>
                {mestrisLoading && (
                  <p className="text-xs text-gray-500 mt-1">Loading mestris...</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="remarks" className="block text-sm font-medium text-slate-700">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={form.remarks || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors resize-none"
                  placeholder="Enter any remarks or notes..."
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


