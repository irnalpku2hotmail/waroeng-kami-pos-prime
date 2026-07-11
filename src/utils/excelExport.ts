// xlsx is ~450 KB gzipped — load it on demand so it never enters
// the main admin bundle. Only executed the moment a user clicks Export.
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
