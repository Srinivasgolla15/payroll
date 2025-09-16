export enum EmployeeStatus {
    Active = 'Active',
    Left = 'Left'
}

export interface Mestri {
    id?: string;
    mestriId: string;
    name: string;
    phoneNumber: string;
    createdAt?: string; // always string in Redux
    updatedAt?: string;
}


export interface MasterEmployee {
    name: string;
    empId: string;
    dept: string;
    mestri: string;
    status: EmployeeStatus;
    perDayWage: number;
    joiningDate: string;
    ifsc: string;
    bankHolderName: string;
    bankCode: string;
    accountNumber: string;
    number: string; // phone number
}

export interface PayrollData extends MasterEmployee {
    sNo: number;
    duties: number;
    ot: number;
    totalDuties: number;
    advance: number;
    pf: number;
    esi: number;
    tds: number;
    others: number;
    bonus: number;
    cash: number;
    cashOrAccount: 'Cash' | 'Account';
    paid: 'Yes' | 'No';
    salary: number;
    otWages: number;
    totalSalary: number;
    netSalary: number;
    balance: number;
}

export interface Employee extends PayrollData {
    totalDuties: number;
    salary: number;
    otWages: number;
    totalSalary: number;
    netSalary: number;
    balance: number;
}