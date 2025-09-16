import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PayrollData, Mestri } from '../src/types/firestore';
import { useAppSelector } from '../redux/hooks';

interface PayrollEditModalProps {
  row: PayrollData;
  onClose: () => void;
  onSave: (updated: PayrollData) => void;
}

export const PayrollEditModal: React.FC<PayrollEditModalProps> = ({ row, onClose, onSave }) => {
  const [form, setForm] = useState<PayrollData>({ ...row });
  const mestris = useAppSelector(s => s.mestri.list) as unknown as Mestri[];

  const numericKeys: (keyof PayrollData | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'kancha' | 'lastMonth')[] = useMemo(() => [
    'duties','ot','advance','cash','perDayWage','ph','bus','food','eb','shoes','kancha','lastMonth'
  ], []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof PayrollData;
    setForm(prev => {
      const next: PayrollData = {
        ...prev,
        [key]: numericKeys.includes(key) ? (value === '' ? 0 : parseFloat(value) || 0) : (value as any),
      } as PayrollData;
      // Auto calculations
      const duties = Number(next.duties) || 0;
      const ot = Number(next.ot) || 0;
      const perDay = Number(next.perDayWage) || 0;
      const salary = duties * perDay;
      const otWages = ot * perDay * 1.5;
      const totalSalary = salary + otWages;
      next.totalDuties = duties + ot;
      next.salary = salary;
      next.otWages = otWages;
      next.totalSalary = totalSalary;
      // Deductions use ph, bus, food, eb, shoes, kancha, lastMonth
      const ph = Number((next as any).ph) || 0;
      const bus = Number((next as any).bus) || 0;
      const food = Number((next as any).food) || 0;
      const eb = Number((next as any).eb) || 0;
      const shoes = Number((next as any).shoes) || 0;
      const kancha = Number((next as any).kancha) || 0;
      const lastMonth = Number((next as any).lastMonth) || 0;
      const advance = Number(next.advance) || 0;
      const others = Number(next.others) || 0; // kept if present
      const deductions = ph + bus + food + eb + shoes + kancha + lastMonth + advance + others;
      next.deductions = deductions;
      next.totalPayment = totalSalary + (Number(next.bonus) || 0) - deductions;
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Edit Payroll</h2>
          <button aria-label="Close" className="text-slate-500 hover:text-slate-700" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
              <input id="name" aria-label="Name" placeholder="Name" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800" name="name" value={form.name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="empId">EMP ID</label>
              <input id="empId" aria-label="EMP ID" placeholder="EMP ID" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800" name="empId" value={form.empId} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dept">Dept</label>
              <input id="dept" aria-label="Dept" placeholder="Dept" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800" name="dept" value={form.dept} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mestriId">Mestri</label>
              <select id="mestriId" name="mestriId" value={form.mestriId} onChange={(e) => setForm(prev => ({ ...prev, mestriId: e.target.value }))} className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800">
                {mestris.map(m => (
                  <option key={m.id} value={m.mestriId || m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="perDayWage">Wage</label>
              <input id="perDayWage" aria-label="Wage" placeholder="Wage" type="number" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800" name="perDayWage" value={form.perDayWage} onChange={handleChange} />
            </div>
            {['duties','ot','ph','perDayWage','advance','bus','food','eb','shoes','kancha','lastMonth','cash'].map((k) => (
              <div key={k}>
                <label className="block text-sm font-medium mb-1" htmlFor={k}>{k.toUpperCase()}</label>
                <input id={k} aria-label={k.toUpperCase()} placeholder={k.toUpperCase()} type="number" className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800" name={k} value={(form as any)[k]} onChange={handleChange} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600/80 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">Save</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


