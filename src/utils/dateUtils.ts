const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatMonthYear = (dateString: string): string => {
  const [year, month] = dateString.split('-').map(Number);
  return `${monthNames[month - 1]}-${year}`;
};

export const formatMonthYearForInput = (dateString: string): string => {
  // Convert from "October-2025" back to "2025-10" for input fields
  const [month, year] = dateString.split('-');
  const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase()) + 1;
  return `${year}-${String(monthIndex).padStart(2, '0')}`;
};
