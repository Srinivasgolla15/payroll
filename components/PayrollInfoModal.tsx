import React from 'react';
import { createPortal } from 'react-dom';
import { Employee, PayrollData } from '../src/types/firestore';

interface PayrollInfoModalProps {
  row: PayrollData;
  employee: Employee | null;
  onClose: () => void;
}

export const PayrollInfoModal: React.FC<PayrollInfoModalProps> = ({ row, employee, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Employee & Payroll Info</h2>
          <button aria-label="Close" className="text-slate-500 hover:text-slate-700" onClick={onClose}>×</button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Employee Details</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{employee?.name || row.name}</dd></div>
              <div><dt className="text-slate-500">EMP ID</dt><dd className="font-medium">{employee?.empId || row.empId}</dd></div>
              <div><dt className="text-slate-500">Dept</dt><dd className="font-medium">{(row as any).dept || (employee as any)?.dept || '-'}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="font-medium">{(employee as any)?.status || row.status}</dd></div>
              <div><dt className="text-slate-500">Mestri</dt><dd className="font-medium">{(row as any).mestri?.name || '-'}</dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{employee?.phoneNumber || '-'}</dd></div>
              <div><dt className="text-slate-500">Joining Date</dt><dd className="font-medium">{row.joiningDate?.split('T')[0]}</dd></div>
              <div><dt className="text-slate-500">Bank Holder</dt><dd className="font-medium">{employee?.bankHolderName || row.bankHolderName || '-'}</dd></div>
              <div><dt className="text-slate-500">Account #</dt><dd className="font-medium">{employee?.accountNumber || row.accountNumber || '-'}</dd></div>
              <div><dt className="text-slate-500">IFSC</dt><dd className="font-medium">{employee?.ifsc || row.ifsc || '-'}</dd></div>
            </dl>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Payroll Details</h3>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div><dt className="text-slate-500">Month</dt><dd className="font-medium">{row.month}</dd></div>
              <div><dt className="text-slate-500">Per day Wage</dt><dd className="font-medium">{row.perDayWage}</dd></div>
              <div><dt className="text-slate-500">Duties</dt><dd className="font-medium">{row.duties}</dd></div>
              <div><dt className="text-slate-500">OT</dt><dd className="font-medium">{row.ot}</dd></div>
              <div><dt className="text-slate-500">PH</dt><dd className="font-medium">{(row as any).ph}</dd></div>
              <div><dt className="text-slate-500">Wage</dt><dd className="font-medium">{row.totalSalary}</dd></div>
              <div><dt className="text-slate-500">Bus</dt><dd className="font-medium">{(row as any).bus}</dd></div>
              <div><dt className="text-slate-500">Food</dt><dd className="font-medium">{(row as any).food}</dd></div>
              <div><dt className="text-slate-500">EB</dt><dd className="font-medium">{(row as any).eb}</dd></div>
              <div><dt className="text-slate-500">Shoes</dt><dd className="font-medium">{(row as any).shoes}</dd></div>
              <div><dt className="text-slate-500">Karcha</dt><dd className="font-medium">{(row as any).kancha}</dd></div>
              <div><dt className="text-slate-500">Last month</dt><dd className="font-medium">{(row as any).lastMonth}</dd></div>
              <div><dt className="text-slate-500">Advance</dt><dd className="font-medium">{row.advance}</dd></div>
              <div><dt className="text-slate-500">Cash</dt><dd className="font-medium">{row.cash}</dd></div>
              <div><dt className="text-slate-500">Paid</dt><dd className="font-medium">{String(row.paid)}</dd></div>
              <div><dt className="text-slate-500">Cash/Account</dt><dd className="font-medium">{row.cashOrAccount}</dd></div>
            </dl>
          </div>
        </div>
        <div className="p-5 flex justify-end border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600/80 transition-colors">Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};


