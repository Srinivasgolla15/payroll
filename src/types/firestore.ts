// src/types/firestore.ts
export enum EmployeeStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  OnLeave = 'On Leave',
  Left = 'Left'
}

export enum PaymentMethod {
  Cash = 'Cash',
  Account = 'Account'
}

export enum PaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Pending = 'Pending'
}

export interface Mestri {
  id: string;               // Firestore doc ID
  mestriId?: string;        // Optional business ID
  name: string;
  phoneNumber: string;
  createdAt?: string;       // ISO string
  updatedAt?: string;       // ISO string
}

export interface Employee {
  id: string;               // Firestore doc ID
  empId: string;            // Business employee ID
  name: string;
  phoneNumber: string;
  bankHolderName: string;
  ifsc: string;
  perDayWage: number;
  accountNumber: string;
  status: EmployeeStatus;
  joiningDate: string;      // keep consistent naming
  mestriId: string;    
  dept: string;    // reference to Mestri
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollData {
  id: string;
  employeeId: string;
  mestriId: string;
  month: string;
  // Strong link to employee document
  employeeDocId?: string;
  employeeRef?: any;

  // Employee info
  name: string;
  empId: string;
  dept: string;
  designation: string;
  joiningDate: string;

  // Payment details
  basic: number;
  dailyWage: number;
  perDayWage: number;
  duties: number;
  ot: number;
  advance: number;
  ph: number;
  bus: number;
  food: number;
  eb: number;
  shoes: number;
  karcha: number;
  lastMonth: number;
  deductions: number;
  totalPayment: number;


  // Additional fields (legacy)
  sNo: number;
  pf: number;
  esi: number;
  tds: number;
  others: number;
  bonus: number;
  cash: number;
  cashOrAccount: PaymentMethod;
  paid: boolean;
  status: PaymentStatus;

  // Bank details
  accountNumber: string;
  ifsc: string;
  bankName: string;
  bankHolderName: string;

  // Calculated fields
  totalDuties: number;
  salary: number;
  otWages: number;
  totalSalary: number;
  netSalary: number;
  balance: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Merged from types.ts
  mestri?: Mestri;
}