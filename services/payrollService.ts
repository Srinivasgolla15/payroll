import { PayrollData, PaymentStatus, PaymentMethod, Employee } from '../src/types/firestore';
import * as XLSX from 'xlsx';
import { getPayrolls as getFirebasePayrolls, savePayroll as saveFirebasePayroll } from './firebase';

const OT_MULTIPLIER = 1.5;

// Calculate payroll details based on input data
export const calculatePayroll = (data: PayrollData): PayrollData => {
  const duties = Number(data.duties) || 0;
  const ot = Number(data.ot) || 0;
  const perDay = Number(data.perDayWage) || 0;
  const totalDuties = duties + ot;
  const ph = Number((data as any).ph) || 0;
  const salary = duties * perDay + ph * 497.65;
  const otWages = ot * perDay * OT_MULTIPLIER;
  const totalSalary = salary + otWages;
  // deductions components
  const bus = Number((data as any).bus) || 0;
  const food = Number((data as any).food) || 0;
  const eb = Number((data as any).eb) || 0;
  const shoes = Number((data as any).shoes) || 0;
  const kancha = Number((data as any).kancha) || 0;
  const lastMonth = Number((data as any).lastMonth) || 0;
  const advance = Number(data.advance) || 0;
  const others = Number(data.others) || 0;
  const totalDeductions = ph + bus + food + eb + shoes + kancha + lastMonth + advance + others;
  const payment = totalSalary + (Number(data.bonus) || 0) - totalDeductions;
  const balance = payment - (Number(data.cash) || 0);
  const paid = data.paid || false;
  const status = paid ? PaymentStatus.Paid : (balance <= 0 ? PaymentStatus.Unpaid : PaymentStatus.Pending);

  return {
    ...data,
    totalDuties,
    salary,
    otWages,
    totalSalary,
    netSalary: payment,
    totalPayment: payment,
    balance,
    paid,
    status,
    updatedAt: new Date().toISOString(),
  };
};

// Create default payroll for a new employee with 0 figures
export const createDefaultPayroll = (employee: Employee, month: string): PayrollData => {
  const now = new Date().toISOString();
  return {
    id: `${employee.empId}_${month}`,
    employeeId: employee.id,
    mestriId: employee.mestriId,
    month,
    name: employee.name,
    empId: employee.empId,
    dept: (employee as any).dept || 'General',
    designation: (employee as any).designation || 'Worker',
    joiningDate: employee.joiningDate,
    basic: 0,
    dailyWage: 0,
    perDayWage: (employee as any).perDayWage || 0,
    duties: 0,
    ot: 0,
    advance: 0,
    ph: 0,
    bus: 0,
    food: 0,
    eb: 0,
    shoes: 0,
    kancha: 0,
    lastMonth: 0,
    deductions: 0,
    totalPayment: 0,
    sNo: 0,
    pf: 0,
    esi: 0,
    tds: 0,
    others: 0,
    bonus: 0,
    cash: 0,
    cashOrAccount: PaymentMethod.Cash,
    paid: false,
    status: PaymentStatus.Pending,
    accountNumber: employee.accountNumber,
    ifsc: employee.ifsc,
    bankName: '',
    bankHolderName: employee.bankHolderName,
    totalDuties: 0,
    salary: 0,
    otWages: 0,
    totalSalary: 0,
    netSalary: 0,
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };
};

// Get payrolls for a specific month
export const getPayrolls = async (month: string): Promise<PayrollData[]> => {
  try {
    return await getFirebasePayrolls(month);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    throw error;
  }
};

// Save or update a payroll record
export const savePayroll = async (payrollData: PayrollData): Promise<PayrollData> => {
  try {
    return await saveFirebasePayroll(payrollData);
  } catch (error) {
    console.error('Error saving payroll:', error);
    throw error;
  }
};

// Export utilities
export const exportPayrollToExcel = (rows: PayrollData[], filename: string) => {
  const worksheetData = rows.map(r => ({
    Month: r.month,
    Name: r.name,
    EmpId: r.empId,
    Dept: (r as any).dept,
    Mestri: (r as any).mestri?.name || r.mestriId,
    Status: r.status,
    Duties: r.duties,
    OT: r.ot,
    TotalDuties: r.totalDuties,
    PH: (r as any).ph,
    PerDayWage: r.perDayWage,
    Wage: r.totalSalary,
    Bus: (r as any).bus,
    Food: (r as any).food,
    EB: (r as any).eb,
    Shoes: (r as any).shoes,
    Karcha: (r as any).kancha,
    LastMonth: (r as any).lastMonth,
    Advance: r.advance,
    Payment: r.totalPayment,
    Cash: r.cash,
    Balance: r.balance,
    CashOrAccount: r.cashOrAccount,
    Paid: r.paid,
    AccountNumber: r.accountNumber,
    IFSC: r.ifsc,
    BankHolderName: r.bankHolderName,
  }));
  const ws = XLSX.utils.json_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};