import { PayrollData, PaymentStatus, PaymentMethod, Employee, Mestri } from '../src/types/firestore';
import * as XLSX from 'xlsx';
import { getPayrolls as getFirebasePayrolls, savePayroll as saveFirebasePayroll, getMestriById } from './firebase';

// const OT_MULTIPLIER = 1.5;

// Calculate payroll details based on input data
export const calculatePayroll = (data: PayrollData): PayrollData => {
  const duties = Number(data.duties) || 0;
  const ot = Number(data.ot) || 0;
  const perDay = Number(data.perDayWage) || 0;
  const totalDuties = duties + ot;
  const ph = Number((data as any).ph) || 0;
  const salary = totalDuties * perDay + ph * 497.65;
  // const otWages = ot * perDay * OT_MULTIPLIER;
  const totalSalary = salary ;
  // deductions components
  const bus = Number((data as any).bus) || 0;
  const food = Number((data as any).food) || 0;
  const eb = Number((data as any).eb) || 0;
  const shoes = Number((data as any).shoes) || 0;
  const karcha = Number((data as any).karcha) || 0;
  const lastMonth = Number((data as any).lastMonth) || 0;
  const advance = Number(data.advance) || 0;
  const others = Number(data.others) || 0;
  // Calculate total deductions (exclude PH as it's already added to salary)
  const totalDeductions = bus + food + eb + shoes + karcha + lastMonth + advance + others;
  
  // Create a new object with the updated deductions value
  const updatedData = {
    ...data,
    deductions: totalDeductions
  };
  
  // Debug logs
  // console.log('PH value:', ph);
  // console.log('Base salary:', totalDuties * perDay);
  // console.log('PH addition:', ph * 497.65);
  // console.log('Total salary:', totalSalary);
  // console.log('Total deductions:', totalDeductions);
  // console.log('Bonus:', Number(data.bonus) || 0);
  
  const payment = totalSalary + (Number(data.bonus) || 0) - totalDeductions;
  const balance = payment - (Number(data.cash) || 0);
  const paid = data.paid || false;
  const remarks = data.remarks || "";
  const status = paid ? PaymentStatus.Paid : (balance <= 0 ? PaymentStatus.Unpaid : PaymentStatus.Pending);
  
  // console.log('Final payment:', payment);

  return {
    ...updatedData,
    totalDuties,
    salary,
    // otWages,
    totalSalary,
    netSalary: payment,
    totalPayment: payment,
    balance,
    paid,
    remarks,
    status,
    updatedAt: new Date().toISOString(),
  };
};

// Create default payroll for a new employee with 0 figures
export const createDefaultPayroll = (employee: Employee, month: string): PayrollData => {
  const now = new Date().toISOString();
  return {
    id: `${employee.empId}_${month}`,
    employeeId: employee.empId,
    mestriId: employee.mestriId || '',
    month,
    // strong reference fields
    ...(employee.id ? { employeeDocId: employee.id } : {}),
    // employee details
    name: employee.name || '',
    empId: employee.empId,
    dept: (employee as any).dept || 'General',
    designation: (employee as any).designation || 'Worker',
    joiningDate: employee.joiningDate || now.split('T')[0],
    // payment details
    cashOrAccount: PaymentMethod.Cash,
    paid: false,
    remarks: "",
    status: PaymentStatus.Pending,
    // salary components
    basic: 0,
    dailyWage: 0,
    perDayWage: Number(employee.perDayWage) || 0,
    duties: 0,
    ot: 0,
    advance: 0,
    ph: 0,
    bus: 0,
    food: 0,
    eb: 0,
    shoes: 0,
    karcha: 0,
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
    // bank details
    accountNumber: employee.accountNumber || "",
    ifsc: employee.ifsc || "",
    bankName: "",
    bankHolderName: employee.bankHolderName || "",
    // calculated fields (will be updated by calculatePayroll)
    totalDuties: 0,
    salary: 0,
    otWages: 0,
    totalSalary: 0,
    netSalary: 0,
    balance: 0,
    // timestamps
    createdAt: now,
    updatedAt: now,
  };
};

// Get payrolls for a specific month with optional filtering
export const getPayrolls = async (month: string, filter: { mestriId?: string; employeeId?: string } = {}): Promise<PayrollData[]> => {
  try {
    // Get payrolls from Firebase with filters applied at the query level
    const payrolls = await getFirebasePayrolls(month, filter);

    // Get unique Mestri IDs from payrolls
    const mestriIds = [...new Set(payrolls.map(p => p.mestriId).filter(Boolean))];
    
    // Fetch all Mestri details in a single batch
    const mestriPromises = mestriIds.map(id => getMestriById(id));
    const mestris = await Promise.all(mestriPromises);
    const mestriMap = new Map(mestris.filter(m => m).map(m => [m.id, m]));

    // Enhance payrolls with Mestri details
    return payrolls.map(payroll => ({
      ...payroll,
      mestri: mestriMap.get(payroll.mestriId)
    }));
  } catch (error) {
    console.error('Error in getPayrolls:', error);
    throw error;
  }
};

// Save or update a payroll record
export const savePayroll = async (payrollData: PayrollData): Promise<PayrollData> => {
  try {
    // Remove the mestri object before saving to Firestore
    const { mestri, ...dataToSave } = payrollData;
    const savedPayroll = await saveFirebasePayroll(dataToSave);
    
    // If we have mestri data, include it in the returned object
    if (mestri) {
      return { ...savedPayroll, mestri };
    }
    
    // Otherwise, fetch the mestri data
    if (savedPayroll.mestriId) {
      const mestriData = await getMestriById(savedPayroll.mestriId);
      return { ...savedPayroll, mestri: mestriData };
    }
    
    return savedPayroll;
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
    Karcha: (r as any).karcha,
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