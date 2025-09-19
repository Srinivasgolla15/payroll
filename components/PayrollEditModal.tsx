import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PayrollData, Mestri, PaymentStatus, PaymentMethod } from '../src/types/firestore';
import { useAppSelector } from '../redux/hooks';

interface PayrollEditModalProps {
  row: PayrollData;
  onClose: () => void;
  onSave: (updated: PayrollData) => void;
}

export const PayrollEditModal: React.FC<PayrollEditModalProps> = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState<PayrollData>(() => ({
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
    remarks: row.remarks ?? "",
    status: row.status ?? PaymentStatus.Pending,
    paid: row.paid ?? false,
    cashOrAccount: row.cashOrAccount ?? PaymentMethod.Cash,
    accountNumber: row.accountNumber ?? "",
    ifsc: row.ifsc ?? "",
    bankHolderName: row.bankHolderName ?? "",
    bankName: row.bankName ?? "",
  }));
  const mestris = useAppSelector(s => s.mestri.list) as unknown as Mestri[];

  const numericKeys: (keyof PayrollData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth')[] = useMemo(() => [
    'duties', 'ot', 'advance', 'cash', 'perDayWage', 'ph', 'bus', 'food', 'eb', 'shoes', 'karcha', 'lastMonth'
  ], []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof PayrollData;
    
    // Don't process if the value hasn't actually changed
    if ((form as any)[key]?.toString() === value) {
      return;
    }
    
    setForm(prev => {
      const next: PayrollData = {
        ...prev,
        [key]: numericKeys.includes(key) ? (value === '' ? 0 : parseFloat(value) || 0) : (value as any),
      } as PayrollData;
      // Auto calculations
      const duties = Number(next.duties) || 0;
      const ot = Number(next.ot) || 0;
      const ph = Number((next as any).ph) || 0;
      const perDay = Number(next.perDayWage) || 0;
      
      // Calculate regular salary (duties + OT, excluding PH)
      const regularDuties = duties + ot;
      const regularSalary = regularDuties * perDay;
      
      // Calculate PH pay (PH days * 497.65)
      const phPay = ph * 497.65;
      
      // Total salary is regular salary + PH pay
      const salary = regularSalary + phPay;
      
      // Calculate total duties for display (regular + PH)
      next.totalDuties = regularDuties + ph;
      next.salary = salary;
      next.totalSalary = salary;
      
      // Calculate deductions (exclude PH from deductions)
      const bus = Number((next as any).bus) || 0;
      const food = Number((next as any).food) || 0;
      const eb = Number((next as any).eb) || 0;
      const shoes = Number((next as any).shoes) || 0;
      const karcha = Number((next as any).karcha) || 0;
      const lastMonth = Number((next as any).lastMonth) || 0;
      const advance = Number(next.advance) || 0;
      const others = Number(next.others) || 0;
      
      // Calculate total deductions (exclude PH)
      const deductions = bus + food + eb + shoes + karcha + lastMonth + advance + others;
      next.deductions = deductions;
      
      // Calculate final payment
      next.totalPayment = salary + (Number(next.bonus) || 0) - deductions;
      next.netSalary = next.totalPayment;
      next.balance = next.totalPayment - (Number(next.cash) || 0);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form });
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
                <label htmlFor="mestriId" className="block text-sm font-medium text-gray-700">Mestri</label>
                <select
                  id="mestriId"
                  name="mestriId"
                  value={form.mestriId}
                  onChange={(e) => setForm(prev => ({ ...prev, mestriId: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                >
                  {mestris.map(m => (
                    <option key={m.id} value={m.mestriId || m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
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
                <label htmlFor="paid" className="block text-sm font-medium text-slate-700">Payment Status</label>
                <select
                  id="paid"
                  name="paid"
                  value={form.paid ? 'paid' : 'unpaid'}
                  onChange={(e) => setForm(prev => ({ ...prev, paid: e.target.value === 'paid' }))}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 ">Remarks</label>
                <input
                  type="text"
                  id="remarks"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm transition-colors"
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


