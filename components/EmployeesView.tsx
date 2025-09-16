import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Mestri, EmployeeStatus } from '../src/types/firestore';
import { SearchIcon } from './icons/SearchIcon';
import { useAppDispatch } from '../redux/hooks';
import { updateExistingEmployee } from '../redux/slices/employeesSlice';
import { EditEmployeeModal } from './EditEmployeeModal';

interface EmployeesViewProps {
  employees: Employee[];
  mestriList?: Mestri[]; // Made optional to handle undefined
}

const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
    <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {children}
    </div>
  </div>
);

const InfoPair = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    <p className="text-slate-800 dark:text-slate-100 font-medium">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: EmployeeStatus }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    status === EmployeeStatus.Active
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }`}>
    <span className={`w-2 h-2 rounded-full mr-1.5 ${
      status === EmployeeStatus.Active ? 'bg-green-500' : 'bg-red-500'
    }`}></span>
    {status}
  </span>
);

export const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, mestriList = [] }) => {
  const dispatch = useAppDispatch();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(employees.length > 0 ? employees[0].empId : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.empId === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const getMestriName = (mestriId: string) => {
    if (!mestriList) return 'Unknown'; // Guard against undefined
    const mestri = mestriList.find(m => (m.mestriId || m.id) === mestriId);
    return mestri ? mestri.name : 'Unknown';
  };

  useEffect(() => {
    if (filteredEmployees.length > 0 && !filteredEmployees.find(e => e.empId === selectedEmployeeId)) {
      setSelectedEmployeeId(filteredEmployees[0].empId);
    } else if (filteredEmployees.length === 0) {
      setSelectedEmployeeId(null);
    } else if (!selectedEmployeeId && filteredEmployees.length > 0) {
      setSelectedEmployeeId(filteredEmployees[0].empId);
    }
  }, [filteredEmployees, selectedEmployeeId]);

  const handleSaveEdit = async (updated: Employee) => {
    await dispatch(updateExistingEmployee(updated) as any);
    setIsEditOpen(false);
  };

  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      {/* Left Panel: Employee List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No employees found
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.empId}
                  onClick={() => setSelectedEmployeeId(emp.empId)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedEmployeeId === emp.empId
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        {emp.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800 dark:text-white">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {emp.empId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={emp.status} />
                    <button
                      className="ml-3 px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      onClick={(e) => { e.stopPropagation(); setSelectedEmployeeId(emp.empId); setIsEditOpen(true); }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Employee Details */}
      <div className="hidden md:block flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm space-y-6">
        {selectedEmployee ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {selectedEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedEmployee.empId}</p>
                </div>
              </div>
              <StatusBadge status={selectedEmployee.status} />
            </div>
            
            <DetailCard title="General Information">
              <InfoPair label="Mestri" value={getMestriName(selectedEmployee.mestriId)} />
              <InfoPair label="Joining Date" value={new Date(selectedEmployee.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoPair label="Per Day Wage" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(selectedEmployee.perDayWage)} />
            </DetailCard>

            <DetailCard title="Contact Information">
              <InfoPair label="Phone" value={selectedEmployee.phoneNumber || 'N/A'} />
            </DetailCard>
            
            <DetailCard title="Bank Details">
              <InfoPair label="Bank Holder" value={selectedEmployee.bankHolderName || 'N/A'} />
              <InfoPair label="Account #" value={selectedEmployee.accountNumber || 'N/A'} />
              <InfoPair label="IFSC" value={selectedEmployee.ifsc || 'N/A'} />
            </DetailCard>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Select an employee</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Choose an employee from the list to view details</p>
          </div>
        )}
      </div>

      {isEditOpen && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          mestriList={mestriList}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};