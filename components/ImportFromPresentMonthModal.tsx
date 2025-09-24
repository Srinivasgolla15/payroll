import React, { useState, useEffect } from 'react';
import { Employee } from '../src/types/firestore';
import { useAppSelector } from '../redux/hooks';
import { saveLastEmployee, getLastEmployeesByMonth } from '../services/lastEmployeeService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ImportFromPresentMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  onImportComplete: () => void;
}

export const ImportFromPresentMonthModal: React.FC<ImportFromPresentMonthModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  onImportComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const masterEmployees = useAppSelector(state => state.employees.masterList as Employee[]);

  // Check if employee already exists for the month in lastemployees collection
  const checkIfEmployeeExistsForMonth = async (empId: string, month: string): Promise<{exists: boolean, id?: string}> => {
    try {
      const lastEmployees = await getLastEmployeesByMonth(month);
      const existing = lastEmployees.find(emp => emp.empId === empId);
      return {
        exists: !!existing,
        id: existing?.id
      };
    } catch (error) {
      console.error('Error checking existing employee:', error);
      return { exists: false };
    }
  };

  // Generate a list of months including current month and last 5 months
  useEffect(() => {
    if (!isOpen) return;
    
    const months: string[] = [];
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1; // 1-12
    
    // Add current month and previous 5 months (total of 6 months)
    for (let i = 0; i < 6; i++) {
      // Format as YYYY-MM
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
      
      // Move to previous month
      month--;
      if (month === 0) {
        month = 12;
        year--;
      }
    }
    
    setAvailableMonths(months);
    // Default to the most recent month (current month)
    setSelectedMonth(months[0] || '');
  }, [isOpen]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setImportedCount(0);
      setIsImporting(false);
    }
  }, [isOpen]);

  const handleImport = async () => {
    if (!selectedMonth) return;
    
    try {
      setIsImporting(true);
      setImportedCount(0);
      
      if (!masterEmployees || masterEmployees.length === 0) {
        toast.warning('No employees found to import');
        setIsImporting(false);
        return;
      }

      const year = currentMonth.split('-')[0];
      let successCount = 0;
      
      for (const emp of masterEmployees) {
        try {
          // Skip if already exists for this month
          const existingCheck = await checkIfEmployeeExistsForMonth(emp.empId, currentMonth);
          if (existingCheck.exists) {
            console.log(`Skipping ${emp.name} - already exists for ${currentMonth}`);
            setImportedCount(prev => prev + 1);
            continue;
          }

          const payload = {
            name: emp.name,
            empId: emp.empId,
            dept: emp.dept || 'General',
            phoneNumber: emp.phoneNumber || '',
            accountNumber: emp.accountNumber || '',
            ifsc: emp.ifsc || '',
            bankName: '', // Not in Employee type
            bankHolderName: emp.bankHolderName || '',
            joiningDate: emp.joiningDate || new Date().toISOString().split('T')[0],
            perDayWage: Number(emp.perDayWage) || 0,
            employeeStatus: emp.status || 'Active',
            month: currentMonth,
            year: year,
            type: 'employee_payroll' as const,
            // Payroll data
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
            salary: 0,
            totalSalary: 0,
            netSalary: 0,
            deductions: 0,
            paid: false,
            status: 'Unpaid',
            // Calculated fields
            dailyWage: Number(emp.perDayWage) || 0,
            totalDuties: 0,
            otWages: 0,
            balance: 0,
            // References
            mestriId: emp.mestriId || '',
            mestri: '', // Not in Employee type
            remarks: '',
            cashOrAccount: 'cash' as const,
          };
          await saveLastEmployee(payload);
          successCount++;
          setImportedCount(prev => prev + 1);
        } catch (error: any) {
          console.error(`Error saving employee ${emp.name}:`, error);
          toast.error(`Failed to import ${emp.name}: ${error?.message || 'Unknown error'}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} employees to ${currentMonth}`);
        onImportComplete();
      } else if (masterEmployees.length > 0) {
        toast.info('All employees already exist for this month');
      }
    } catch (error) {
      console.error('Error importing payroll data:', error);
      toast.error('Failed to import payroll data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import from Present Month</h2>
        
        <div className="mb-4">
          <label htmlFor="import-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Month to Import From (Current and last 5 months)
          </label>
          <select
            id="import-month"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={isLoading || isImporting}
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {new Date(`${month}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedMonth || isImporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import Employees'
            )}
          </button>
        </div>
        
        {isImporting && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Importing {importedCount} employees...
          </div>
        )}
      </div>
    </div>
  );
};
