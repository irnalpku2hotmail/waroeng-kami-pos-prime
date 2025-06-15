
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate and download the file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
