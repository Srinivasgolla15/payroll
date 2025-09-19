import React from 'react';

export const Dashboard: React.FC = () => <div className="p-6"></div>;
  const payrollDataByMonth = useAppSelector((state) => state.payroll.payrollDataByMonth);

  // Aggregate payroll totals by month
  const { months, totalPayrollPerMonth } = useMemo(() => {
    const months = Object.keys(payrollDataByMonth).sort();
    const totalPayrollPerMonth: number[] = [];
    months.forEach((month) => {
      const payrolls = payrollDataByMonth[month] || [];
      const total = payrolls.reduce((sum, p) => sum + (p.totalPayment || 0), 0);
      totalPayrollPerMonth.push(total);
    });
    return { months, totalPayrollPerMonth };
  }, [payrollDataByMonth]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Payroll Dashboard</h2>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <h3 className="font-semibold mb-2">Payroll Trend (Line Graph)</h3>
        <Line
          data={{
            labels: months,
            datasets: [{
              label: 'Total Payroll (INR)',
              data: totalPayrollPerMonth,
              borderColor: 'rgba(59,130,246,1)',
              backgroundColor: 'rgba(59,130,246,0.2)',
              tension: 0.3,
              fill: true,
            }],
          }}
          options={{ responsive: true }}
        />
      </div>
    </div>
  );
};
