
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportCreditData = (creditData: any[]) => {
  const formattedData = creditData.map(credit => ({
    'Transaction Number': credit.transaction_number,
    'Customer': credit.customers?.name || 'N/A',
    'Total Amount': credit.total_amount,
    'Paid Amount': credit.paid_amount,
    'Outstanding': credit.total_amount - credit.paid_amount,
    'Due Date': credit.due_date,
    'Status': credit.total_amount <= credit.paid_amount ? 'Paid' : 
              new Date(credit.due_date) < new Date() ? 'Overdue' : 'Active',
    'Created Date': new Date(credit.created_at).toLocaleDateString('id-ID')
  }));
  
  exportToExcel(formattedData, 'credit-management', 'Credit Data');
};

export const exportPointsRewardsData = (pointsData: any[], rewardsData: any[]) => {
  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new();
  
  // Format points data
  const formattedPointsData = pointsData.map(transaction => ({
    'Transaction Number': transaction.transaction_number,
    'Customer': transaction.customers?.name || 'N/A',
    'Points Earned': transaction.points_earned,
    'Points Used': transaction.points_used,
    'Net Points': transaction.points_earned - transaction.points_used,
    'Transaction Date': new Date(transaction.created_at).toLocaleDateString('id-ID')
  }));
  
  // Format rewards data
  const formattedRewardsData = rewardsData.map(reward => ({
    'Reward Name': reward.name,
    'Description': reward.description || 'N/A',
    'Stock Quantity': reward.stock_quantity,
    'Status': reward.is_active ? 'Active' : 'Inactive',
    'Created Date': new Date(reward.created_at).toLocaleDateString('id-ID')
  }));
  
  // Create worksheets
  const pointsWorksheet = XLSX.utils.json_to_sheet(formattedPointsData);
  const rewardsWorksheet = XLSX.utils.json_to_sheet(formattedRewardsData);
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, pointsWorksheet, 'Points Transactions');
  XLSX.utils.book_append_sheet(workbook, rewardsWorksheet, 'Rewards');
  
  // Generate and download file
  XLSX.writeFile(workbook, 'points-rewards-data.xlsx');
};
