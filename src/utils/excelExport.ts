/**
 * Exports rows to .xlsx. `xlsx` is loaded dynamically so the ~400KB library
 * never lands in any admin route's initial chunk — it is fetched on first export.
 */
export const exportToExcel = async (
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
