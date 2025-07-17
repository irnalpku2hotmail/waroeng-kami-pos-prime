
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const ExcelImport = ({ onImportSuccess }: { onImportSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Nama Produk': 'Contoh Produk',
        'Barcode': '1234567890',
        'Harga Dasar': 10000,
        'Harga Jual': 15000,
        'Stok Awal': 100,
        'Stok Minimum': 10,
        'Poin Loyalty': 1,
        'Deskripsi': 'Deskripsi produk',
        'Aktif': 'Ya'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Produk');
    XLSX.writeFile(workbook, 'template_produk.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const processExcelFile = async (file: File) => {
    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsBinaryString(file);
    });
  };

  const importProducts = async () => {
    if (!file) return;

    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      const excelData = await processExcelFile(file);
      
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i] as any;
        
        try {
          const productData = {
            name: row['Nama Produk'],
            barcode: row['Barcode'] || null,
            base_price: Number(row['Harga Dasar']) || 0,
            selling_price: Number(row['Harga Jual']) || 0,
            current_stock: Number(row['Stok Awal']) || 0,
            min_stock: Number(row['Stok Minimum']) || 10,
            loyalty_points: Number(row['Poin Loyalty']) || 1,
            description: row['Deskripsi'] || null,
            is_active: row['Aktif'] === 'Ya' || row['Aktif'] === 'TRUE' || row['Aktif'] === true
          };

          // Validate required fields
          if (!productData.name) {
            errors.push(`Baris ${i + 2}: Nama produk tidak boleh kosong`);
            failedCount++;
            continue;
          }

          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) {
            errors.push(`Baris ${i + 2}: ${error.message}`);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Baris ${i + 2}: Error processing data - ${error}`);
          failedCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Show only first 10 errors
      });

      if (successCount > 0) {
        toast({
          title: 'Import Berhasil',
          description: `${successCount} produk berhasil diimpor`,
        });
        onImportSuccess();
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses file Excel',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Produk dari Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Download Template */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Template Excel</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download template Excel terlebih dahulu untuk memastikan format yang benar
            </p>
            <Button onClick={downloadTemplate} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Upload File Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600">
                File dipilih: {file.name}
              </p>
            )}
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import selesai: {importResults.success} berhasil, {importResults.failed} gagal
                </AlertDescription>
              </Alert>
              
              {importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Error yang ditemukan:</p>
                      <ul className="text-sm space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Tutup
            </Button>
            <Button 
              onClick={importProducts}
              disabled={!file || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Produk
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;
