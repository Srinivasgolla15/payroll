import React from 'react';
import { createPortal } from 'react-dom';
import { Employee, PayrollData } from '../src/types/firestore';

interface PayrollInfoModalProps {
  row: PayrollData;
  employee: Employee | null;
  onClose: () => void;
}

export const PayrollInfoModal: React.FC<PayrollInfoModalProps> = ({ row, employee, onClose }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return dateString.split('T')[0];
    }
  };

  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '₹0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(isNaN(num) ? 0 : num);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Employee & Payroll Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Information */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-base font-medium text-gray-900">Employee Information</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{employee?.name || row.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{employee?.empId || row.empId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{(row as any).dept || (employee as any)?.dept || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(employee as any)?.status === 'Active' || row.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {(employee as any)?.status || row.status || 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Contact & Bank Details</h4>
                  <dl className="grid grid-cols-1 gap-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{employee?.phoneNumber || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Joining Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(row.joiningDate)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Bank Holder Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{employee?.bankHolderName || row.bankHolderName || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                      <dd className="mt-1 text-sm font-mono text-gray-900">{employee?.accountNumber || row.accountNumber || '-'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">IFSC Code</dt>
                      <dd className="mt-1 text-sm font-mono text-gray-900">{employee?.ifsc || row.ifsc || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Payroll Information */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-2">
                <h3 className="text-base font-medium text-gray-900">Payroll Details - {row.month}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Earnings</h4>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Per Day Wage</p>
                        <p className="text-sm font-medium">{formatCurrency(row.perDayWage)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Days</p>
                        <p className="text-sm font-medium">{row.duties || 0} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Overtime</p>
                        <p className="text-sm font-medium">{row.ot || 0} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">PH Days</p>
                        <p className="text-sm font-medium">{(row as any).ph || 0}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Total Earnings</p>
                        <p className="text-sm font-bold">{formatCurrency(row.totalSalary)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Deductions</h4>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'advance', label: 'Advance' },
                        { key: 'bus', label: 'Bus' },
                        { key: 'food', label: 'Food' },
                        { key: 'eb', label: 'EB' },
                        { key: 'shoes', label: 'Shoes' },
                        { key: 'karcha', label: 'Karcha' },
                        { key: 'lastMonth', label: 'Last Month' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-sm font-medium">{formatCurrency((row as any)[key])}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Total Deductions</p>
                        <p className="text-sm font-bold">{formatCurrency(row.deductions)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h4>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Net Salary</p>
                        <p className="text-sm font-medium">{formatCurrency(row.netSalary)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-600">Cash Paid</p>
                        <p className="text-sm font-medium">{formatCurrency(row.cash)}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Balance</p>
                          <p className={`text-sm font-bold ${row.balance > 0 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                            {formatCurrency(Math.abs(row.balance || 0))}
                            {row.balance > 0 ? ' (Due)' : ' (Advance)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.paid ? 'Paid' : 'Unpaid'}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.cashOrAccount || 'Account'}
                  </span>

                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="text-sm font-medium">{ row.remarks || '-'}</p>
                </div>
              </div>
            </div> 
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


