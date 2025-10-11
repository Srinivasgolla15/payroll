// src/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentData,
  Query,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
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

// Fetch mestri by either Firestore document id or business mestriId field
export const getMestriByAnyId = async (idOrBusinessId: string): Promise<Mestri | null> => {
  if (!idOrBusinessId) return null;
  // Try as document id first
  const byDoc = await getMestriById(idOrBusinessId);
  if (byDoc) return byDoc;
  // Fallback: query by business mestriId field
  try {
    const qy = query(mestrisRef, where('mestriId', '==', idOrBusinessId));
    const snap = await getDocs(qy);
    const first = snap.docs[0];
    return first ? mapMestriDoc(first as any) : null;
  } catch (e) {
    console.warn('getMestriByAnyId failed:', e);
    return null;
  }
};

const mapMestriDoc = (docSnap: any): Mestri => {
  const data = docSnap.data();
  return {
    id: (docSnap as any).id,
    mestriId: data.mestriId || (docSnap as any).id,
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
  try {
    // Always auto-generate document ID, never use empId as document ID
    const docRef = doc(employeesRef);

    // Generate empId if not provided (but don't use it as document ID)
    const empId = employeeData.empId || docRef.id;

    const now = new Date().toISOString();
    const employeeWithTimestamps = {
      ...employeeData,
      empId, // Store empId as data field, not as document ID
      dept: employeeData.dept || 'General', // Add default department
      status: employeeData.status || 'active',
      createdAt: employeeData.createdAt || now,
      updatedAt: now,
    };

    await setDoc(docRef, employeeWithTimestamps);

    return {
      id: docRef.id, // Return the auto-generated document ID
      ...employeeWithTimestamps
    } as Employee;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
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
// Helper function to map a document to PayrollData
export const mapPayrollDoc = async (snap: QueryDocumentSnapshot): Promise<PayrollData> => {
  const data = snap.data();
  const now = new Date().toISOString();
  const employeeId = data.employeeId || data.empId || ''; // Try both employeeId and empId

  console.log('Firebase - mapPayrollDoc called with:', snap.id);
  console.log('Firebase - data.remarks:', data.remarks);
  console.log('Firebase - data.mestri:', data.mestri);
  console.log('Firebase - data keys:', Object.keys(data));

  // Get employee data
  let employeeData: any = {};
  try {
    if (employeeId) {
      const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
      if (employeeDoc.exists()) {
        employeeData = employeeDoc.data() || {};
      }
    }
  } catch (error) {
    console.warn(`Could not fetch employee data for ${employeeId}:`, error);
  }

  // Get mestri data if available
  let mestriData: Mestri | null = null;
  const effectiveMestriId = (data as any).mestriId || employeeData.mestriId || '';
  if (effectiveMestriId) {
    try {
      mestriData = await getMestriByAnyId(effectiveMestriId);
    } catch (error) {
      console.warn(`Could not fetch mestri data for ${effectiveMestriId}:`, error);
    }
  }

  const defaultMestri: Mestri = {
    id: employeeData.mestriId || "",
    mestriId: employeeData.mestriId || "",
    name: "Unknown Mestri",
    phoneNumber: "",
    createdAt: now,
    updatedAt: now,
  };

  const result = {
    id: snap.id,
    employeeId,
    mestriId: effectiveMestriId,
    month: data.month || "",
    name: employeeData.name || data.name || "",
    empId: employeeData.empId || data.empId || employeeId,
    dept: employeeData.dept || data.dept || "General",
    designation: employeeData.designation || data.designation || "Worker",
    joiningDate: employeeData.joiningDate || data.joiningDate || now.split("T")[0],
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
    karcha: Number(data.karcha) || 0,
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
    cashOrAccount: data.cashOrAccount === PaymentMethod.Account ? PaymentMethod.Account : PaymentMethod.Cash,
    paid: Boolean(data.paid),
    status: data.status === PaymentStatus.Paid ? PaymentStatus.Paid :
            data.status === PaymentStatus.Unpaid ? PaymentStatus.Unpaid : PaymentStatus.Pending,
    accountNumber: employeeData.accountNumber || data.accountNumber || "",
    ifsc: employeeData.ifsc || data.ifsc || "",
    bankName: employeeData.bankName || data.bankName || "",
    bankHolderName: employeeData.bankHolderName || data.bankHolderName || "",
    totalDuties: Number(data.totalDuties) || 0,
    salary: Number(data.salary) || 0,
    otWages: Number(data.otWages) || 0,
    totalSalary: Number(data.totalSalary) || 0,
    netSalary: Number(data.netSalary) || 0,
    balance: Number(data.balance) || 0,
    createdAt: toDateString(data.createdAt || now),
    updatedAt: toDateString(data.updatedAt || now),
    mestri: mestriData || defaultMestri,
    // Include all additional fields from the database
    ...Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        !['id', 'employeeId', 'mestriId', 'month', 'name', 'empId', 'dept', 'designation', 'joiningDate',
         'basic', 'dailyWage', 'perDayWage', 'duties', 'ot', 'advance', 'ph', 'bus', 'food', 'eb',
         'shoes', 'karcha', 'lastMonth', 'deductions', 'totalPayment', 'sNo', 'pf', 'esi', 'tds',
         'others', 'bonus', 'cash', 'cashOrAccount', 'paid', 'status', 'accountNumber', 'ifsc',
         'bankName', 'bankHolderName', 'totalDuties', 'salary', 'otWages', 'totalSalary',
         'netSalary', 'balance', 'createdAt', 'updatedAt'].includes(key)
      )
    )
  };

  console.log('Firebase - mapPayrollDoc result:', result);
  return result;
};

export const getPayrolls = async (
  month: string,
  filter?: { mestriId?: string; employeeId?: string }
): Promise<PayrollData[]> => {
  try {
    // Start with base query
    let q = query(collection(db, 'payroll'), where('month', '==', month));
    
    // Add employeeId filter if provided
    if (filter?.employeeId) {
      q = query(q, where('employeeId', '==', filter.employeeId));
    }
    
    // If mestriId is provided, we need to filter after fetching
    if (filter?.mestriId) {
      const snapshot = await getDocs(q);
      const filteredPromises: Promise<PayrollData>[] = [];
      
      for (const d of snapshot.docs) {
        const data = d.data() as { employeeId?: string };
        const employeeId = data.employeeId;
        
        if (employeeId) {
          try {
            const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
            if (employeeDoc.exists()) {
              const employeeData = employeeDoc.data() as { mestriId?: string };
              if (employeeData?.mestriId === filter.mestriId) {
                filteredPromises.push(mapPayrollDoc(d as any));
              }
            }
          } catch (error) {
            console.warn(`Error fetching employee ${employeeId}:`, error);
          }
        }
      }
      
      return Promise.all(filteredPromises);
    }
    
    // No mestriId filter, just fetch all matching month
    const snapshot = await getDocs(q);
    return Promise.all(snapshot.docs.map(d => mapPayrollDoc(d as any)));
  } catch (error) {
    console.error('Error in getPayrolls:', error);
    throw error;
  }
};

export const savePayroll = async (
  payrollData: PayrollData
): Promise<PayrollData> => {
  // Use existing ID if available, otherwise let Firebase auto-generate
  const docRef = payrollData.id
    ? doc(payrollRef, payrollData.id)
    : doc(payrollRef);

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

// Export the db instance and other utilities
export {
  db,
  app,
  auth,
  analytics,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  // Firebase Auth exports
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
};

// Re-export types from the types file
export type {
  Employee,
  Mestri,
  PayrollData,
  EmployeeStatus,
  PaymentStatus
} from '../src/types/firestore';

// Export the employee-related functions
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    const docRef = doc(collection(db, 'employees'), id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting employee by ID:', error);
    throw error;
  }
};