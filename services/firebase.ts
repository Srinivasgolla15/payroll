// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  DocumentReference,
  updateDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import {
  Mestri,
  Employee,
  PayrollData,
  EmployeeStatus,
  PaymentMethod,
  PaymentStatus,
} from "../src/types/firestore";

/* ---------------- Firebase Config ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCG6nyDgUc7D9GYZPoKjbM7DE-T1t7aXuU",
  authDomain: "payrollmanagement-6fcee.firebaseapp.com",
  projectId: "payrollmanagement-6fcee",
  storageBucket: "payrollmanagement-6fcee.firebasestorage.app",
  messagingSenderId: "227286370049",
  appId: "1:227286370049:web:f94f359c6551df2c8bfd00",
  measurementId: "G-EJDTPL58C7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

/* ---------------- Helpers ---------------- */
const toDateString = (value?: Date | Timestamp | string): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

/* ---------------- References ---------------- */
const mestrisRef = collection(db, "mestris");
const employeesRef = collection(db, "employees");
const payrollRef = collection(db, "payroll");
const employeesRefPath = "employees";

/* --------------------- MESTRIS --------------------- */
export const getMestris = async (): Promise<Mestri[]> => {
  const snapshot = await getDocs(mestrisRef);
  return snapshot.docs.map((doc) => mapMestriDoc(doc));
};

export const getMestriById = async (id: string): Promise<Mestri | null> => {
  try {
    const docRef = doc(db, 'mestris', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return mapMestriDoc(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching mestri:', error);
    return null;
  }
};

const mapMestriDoc = (doc: QueryDocumentSnapshot<DocumentData>): Mestri => {
  const data = doc.data();
  return {
    id: doc.id,
    mestriId: data.mestriId || doc.id,
    name: data.name || "",
    phoneNumber: data.phoneNumber || "",
    createdAt: toDateString(data.createdAt),
    updatedAt: toDateString(data.updatedAt),
  };
};

export const addMestri = async (
  mestriData: Partial<Mestri>
): Promise<Mestri> => {
  const docRef = doc(mestrisRef);
  const now = new Date().toISOString();
  const newMestri: Mestri = {
    id: docRef.id,
    mestriId: mestriData.mestriId || docRef.id,
    name: mestriData.name || "",
    phoneNumber: mestriData.phoneNumber || "",
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, newMestri);
  return newMestri;
};

export const updateMestri = async (mestriData: Mestri): Promise<Mestri> => {
  if (!mestriData.id) throw new Error("Mestri ID is required for update");
  const docRef = doc(db, "mestris", mestriData.id);
  const updatedAt = new Date().toISOString();
  const updateData = {
    ...mestriData,
    updatedAt,
  };
  await setDoc(docRef, updateData, { merge: true });
  return { ...mestriData, updatedAt };
};

/* --------------------- EMPLOYEES --------------------- */
export const getEmployees = async (
  mestriId?: string
): Promise<Employee[]> => {
  let q = query(employeesRef);
  if (mestriId) q = query(employeesRef, where("mestriId", "==", mestriId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      empId: data.empId || doc.id,
      name: data.name || "",
      phoneNumber: data.phoneNumber || "",
      bankHolderName: data.bankHolderName || "",
      ifsc: data.ifsc || "",
      accountNumber: data.accountNumber || "",
      status: data.status || EmployeeStatus.Active,
      joiningDate: data.joiningDate || new Date().toISOString().split("T")[0],
      mestriId: data.mestriId || "",
      perDayWage: Number(data.perDayWage) || 0, 
      createdAt: toDateString(data.createdAt),
      updatedAt: toDateString(data.updatedAt),
    } as Employee;
  });
};

export const addEmployee = async (
  employeeData: Partial<Employee>
): Promise<Employee> => {
  const docRef = doc(employeesRef);
  const now = new Date().toISOString();
  const newEmployee: Employee = {
    id: docRef.id,
    empId: employeeData.empId || docRef.id,
    name: employeeData.name || "",
    phoneNumber: employeeData.phoneNumber || "",
    bankHolderName: employeeData.bankHolderName || "",
    ifsc: employeeData.ifsc || "",
    accountNumber: employeeData.accountNumber || "",
    status: employeeData.status || EmployeeStatus.Active,
    joiningDate: employeeData.joiningDate || new Date().toISOString().split("T")[0],
    mestriId: employeeData.mestriId || "",
    perDayWage: Number(employeeData.perDayWage) || 0,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, newEmployee);
  return newEmployee;
};

export const updateEmployee = async (
  employeeData: Employee
): Promise<Employee> => {
  if (!employeeData.id) throw new Error('Employee id is required for update');
  const now = new Date().toISOString();
  const docRef = doc(employeesRef, employeeData.id);
  const dataToUpdate = {
    ...employeeData,
    updatedAt: now,
  } as any;
  await updateDoc(docRef, dataToUpdate);
  return { ...employeeData, updatedAt: now };
};

/* --------------------- PAYROLL --------------------- */
export const getPayrolls = async (
  month: string,
  filter?: { mestriId?: string; employeeId?: string }
): Promise<PayrollData[]> => {
  let q = query(payrollRef, where("month", "==", month));
  
  // Apply filters if provided
  if (filter) {
    if (filter.mestriId) {
      q = query(q, where("mestriId", "==", filter.mestriId));
    }
    if (filter.employeeId) {
      q = query(q, where("employeeId", "==", filter.employeeId));
    }
  }
  
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const now = new Date().toISOString();
    const defaultMestri: Mestri = {
      id: data.mestriId || "",
      mestriId: data.mestriId || "",
      name: "Unknown Mestri",
      phoneNumber: "",
      createdAt: now,
      updatedAt: now,
    };
    return {
      id: doc.id,
      employeeId: data.employeeId || "",
      mestriId: data.mestriId || "",
      month: data.month || month,
      name: data.name || "",
      empId: data.empId || "",
      dept: data.dept || "General",
      designation: data.designation || "Worker",
      joiningDate: data.joiningDate || now.split("T")[0],
      basic: Number(data.basic) || 0,
      dailyWage: Number(data.dailyWage) || 0,
      perDayWage: Number(data.perDayWage) || 0,
      duties: Number(data.duties) || 0,
      ot: Number(data.ot) || 0,
      advance: Number(data.advance) || 0,
      ph: Number(data.ph) || 0,
      bus: Number(data.bus) || 0,
      food: Number(data.food) || 0,
      eb: Number(data.eb) || 0,
      shoes: Number(data.shoes) || 0,
      kancha: Number(data.kancha) || 0,
      lastMonth: Number(data.lastMonth) || 0,
      deductions: Number(data.deductions) || 0,
      totalPayment: Number(data.totalPayment) || 0,
      sNo: Number(data.sNo) || 0,
      pf: Number(data.pf) || 0,
      esi: Number(data.esi) || 0,
      tds: Number(data.tds) || 0,
      others: Number(data.others) || 0,
      bonus: Number(data.bonus) || 0,
      cash: Number(data.cash) || 0,
      cashOrAccount:
        data.cashOrAccount === PaymentMethod.Account
          ? PaymentMethod.Account
          : PaymentMethod.Cash,
      paid: Boolean(data.paid),
      status:
        data.status === PaymentStatus.Paid
          ? PaymentStatus.Paid
          : data.status === PaymentStatus.Unpaid
          ? PaymentStatus.Unpaid
          : PaymentStatus.Pending,
      accountNumber: data.accountNumber || "",
      ifsc: data.ifsc || "",
      bankName: data.bankName || "",
      bankHolderName: data.bankHolderName || "",
      totalDuties: Number(data.totalDuties) || 0,
      salary: Number(data.salary) || 0,
      otWages: Number(data.otWages) || 0,
      totalSalary: Number(data.totalSalary) || 0,
      netSalary: Number(data.netSalary) || 0,
      balance: Number(data.balance) || 0,
      createdAt: toDateString(data.createdAt),
      updatedAt: toDateString(data.updatedAt),
      mestri: data.mestri || defaultMestri,
    } as PayrollData;
  });
};

export const savePayroll = async (
  payrollData: PayrollData
): Promise<PayrollData> => {
  const docId = payrollData.id || `${payrollData.employeeId}_${payrollData.month}`;
  const docRef = doc(payrollRef, docId);
  const now = new Date().toISOString();

  const payrollToSave = {
    ...payrollData,
    mestriId: payrollData.mestri?.mestriId || payrollData.mestriId,
    // add explicit employee reference path for strong link
    employeeDocId: (payrollData as any).employeeDocId || payrollData.employeeId,
    employeeRef: doc(db, employeesRefPath, (payrollData as any).employeeDocId || payrollData.employeeId),
    updatedAt: now,
    ...(!payrollData.id && { createdAt: now }),
  };
  const { mestri, ...dataToSave } = payrollToSave;
  await setDoc(docRef, dataToSave, { merge: true });

  return {
    ...payrollData,
    id: docRef.id,
    updatedAt: now,
    ...(!payrollData.id && { createdAt: now }),
  };
};

export const deletePayroll = async (payrollId: string) => {
  await deleteDoc(doc(payrollRef, payrollId));
};