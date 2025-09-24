import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export interface LastEmployeeData {
  // Employee Data
  id?: string;
  name: string;
  empId: string;
  dept: string;
  phoneNumber?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  bankHolderName?: string;
  joiningDate: string;
  perDayWage: number;
  employeeStatus: string;

  // Payroll Data
  month: string;
  duties: number;
  ot: number;
  ph: number;
  bus: number;
  food: number;
  eb: number;
  shoes: number;
  karcha: number;
  lastMonth: number;
  advance: number;
  cash: number;
  others: number;
  salary: number;
  totalSalary: number;
  netSalary: number;
  deductions: number;
  paid: boolean;
  status: string;

  // Calculated Fields
  dailyWage: number;
  totalDuties: number;
  otWages: number;
  balance: number;

  // Additional fields
  mestri?: string;
  mestriId?: string;
  remarks?: string;
  cashOrAccount?: string;

  // Metadata
  type: 'employee_payroll';
  year: string;
  createdAt: string;
  updatedAt: string;
}

export const saveLastEmployee = async (data: Omit<LastEmployeeData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'lastemployees'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error saving last employee:', error);
    throw new Error('Failed to save last employee data');
  }
};

export const getLastEmployeesByMonth = async (month: string): Promise<LastEmployeeData[]> => {
  try {
    const year = new Date(month + '-01').getFullYear().toString();
    const q = query(
      collection(db, 'lastemployees'),
      where('month', '==', month),
      where('year', '==', year),
      where('type', '==', 'employee_payroll')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LastEmployeeData));
  } catch (error) {
    console.error('Error getting last employees:', error);
    throw new Error('Failed to fetch last employees');
  }
};

export const updateLastEmployee = async (id: string, data: Partial<LastEmployeeData>) => {
  try {
    await updateDoc(doc(db, 'lastemployees', id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating last employee:', error);
    throw new Error('Failed to update last employee');
  }
};
