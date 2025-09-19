import React, { useState, useMemo } from 'react';
import { PayrollData } from '../src/types/firestore';

interface PayrollSummaryByMonthProps {
  payrolls: PayrollData[];
}

const getMonthName = (monthStr: string) => {
  // Expects YYYY-MM format
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const PayrollSummaryByMonth: React.FC<PayrollSummaryByMonthProps> = ({ payrolls }) => {
  // Group payrolls by month
  const grouped = useMemo(() => {
    const map: Record<string, PayrollData[]> = {};
    payrolls.forEach((p) => {
      if (!map[p.month]) map[p.month] = [];
      map[p.month].push(p);
    });
    return map;
  }, [payrolls]);

  const months = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Payroll Summary by Month</h3>
      <div className="overflow-x-auto">
        <table className="min-w-max w-full border border-gray-300 dark:border-gray-700 rounded-lg">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800">
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Total Employees</th>
              <th className="px-4 py-2">Total Payroll (INR)</th>
              <th className="px-4 py-2">Paid</th>
              <th className="px-4 py-2">Unpaid</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => {
              const rows = grouped[month];
              const total = rows.reduce((sum, r) => sum + (r.totalPayment || 0), 0);
              const paid = rows.filter(r => r.paid).length;
              const unpaid = rows.length - paid;
              return (
                <tr key={month} className="text-center border-t border-gray-300 dark:border-gray-700">
                  <td className="px-4 py-2 font-medium">{getMonthName(month)}</td>
                  <td className="px-4 py-2">{rows.length}</td>
                  <td className="px-4 py-2">{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</td>
                  <td className="px-4 py-2">{paid}</td>
                  <td className="px-4 py-2">{unpaid}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
