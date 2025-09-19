import { PayrollData, MasterEmployee, Mestri, Employee } from './types';

// MONTHS will be generated dynamically from Redux payrollDataByMonth

export const INITIAL_MESTRIS: Mestri[] = [];

export const INITIAL_EMPLOYEES_MASTER: MasterEmployee[] = [];

export const RESETTABLE_PAYROLL_FIELDS: Omit<PayrollData, keyof MasterEmployee | 'sNo'> = {
    duties: 0,
    ot: 0,
    totalDuties: 0,
    advance: 0,
    pf: 0,
    esi: 0,
    tds: 0,
    others: 0,
    bonus: 0,
    cash: 0,
    cashOrAccount: 'Account',
    paid: 'No',
    salary: 0,
    otWages: 0,
    totalSalary: 0,
    netSalary: 0,
    balance: 0,
};

export const PAYROLL_COLUMNS: { key: keyof PayrollData | 'placeholder' | 'ph' | 'bus' | 'food' | 'eb' | 'shoes' | 'karcha' | 'lastMonth' | 'totalPayment', label: string, editable?: boolean, isNumeric?: boolean }[] = [
    { key: 'sNo', label: 'S.No', isNumeric: true },
    { key: 'name', label: 'Name' },
    { key: 'empId', label: 'EMP ID' },
    { key: 'dept', label: 'Dept' },
    { key: 'mestri', label: 'Mestri' },
    { key: 'status', label: 'Active/Left' },
    { key: 'duties', label: 'Duties', editable: true, isNumeric: true },
    { key: 'ot', label: 'OT', editable: true, isNumeric: true },
    { key: 'totalDuties', label: 'Total Duties', isNumeric: true },
    { key: 'ph', label: 'PH', editable: true, isNumeric: true },
    { key: 'perDayWage', label: 'Per day Wage', editable: true, isNumeric: true },
    { key: 'totalSalary', label: 'Wage', isNumeric: true },
    { key: 'bus', label: 'Bus', editable: true, isNumeric: true },
    { key: 'food', label: 'Food', editable: true, isNumeric: true },
    { key: 'eb', label: 'EB', editable: true, isNumeric: true },
    { key: 'shoes', label: 'Shoes', editable: true, isNumeric: true },
    { key: 'karcha', label: 'Karcha', editable: true, isNumeric: true },
    { key: 'lastMonth', label: 'Last month', editable: true, isNumeric: true },
    { key: 'advance', label: 'Advance', editable: true, isNumeric: true },
    { key: 'totalPayment', label: 'Payment', isNumeric: true },
    { key: 'cash', label: 'Cash', editable: true, isNumeric: true },
    { key: 'balance', label: 'Balance', isNumeric: true },
    { key: 'cashOrAccount', label: 'Cash/Account', editable: true },
    { key: 'paid', label: 'Paid', editable: true },
];