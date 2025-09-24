import { 
  Employee, 
  addEmployee as firebaseAddEmployee, 
  getEmployees as firebaseGetEmployees,
  getEmployeeById as firebaseGetEmployeeById,
  updateEmployee as firebaseUpdateEmployee
} from './firebase';

export const addEmployee = async (employeeData: Partial<Employee>): Promise<Employee> => {
  try {
    return await firebaseAddEmployee(employeeData);
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

export const getEmployees = async (mestriId?: string): Promise<Employee[]> => {
  try {
    return await firebaseGetEmployees(mestriId);
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    return await firebaseGetEmployeeById(id);
  } catch (error) {
    console.error('Error getting employee by ID:', error);
    throw error;
  }
};

export const updateEmployee = async (employeeData: Employee): Promise<Employee> => {
  try {
    return await firebaseUpdateEmployee(employeeData);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};
