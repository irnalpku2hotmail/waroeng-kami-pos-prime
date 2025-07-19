
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

const ExcelImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Contoh Produk 1',
        category_id: 'UUID kategori',
        unit_id: 'UUID unit',
        base_price: 10000,
        selling_price: 15000,
        min_quantity: 1,
        min_stock: 5,
        current_stock: 100,
        barcode: '1234567890123',
        description: 'Deskripsi produk'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-produk.xlsx');
  };

  const processExcelFile = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // Excel row number (starting from 2)

        try {
          // Validate required fields
          if (!row.name || !row.selling_price) {
            errors.push(`Baris ${rowNumber}: Nama dan harga jual wajib diisi`);
            continue;
          }

          // Prepare product data
          const productData = {
            name: row.name,
            category_id: row.category_id || null,
            unit_id: row.unit_id || null,
            base_price: row.base_price || 0,
            selling_price: row.selling_price,
            min_quantity: row.min_quantity || 1,
            min_stock: row.min_stock || 10,
            current_stock: row.current_stock || 0,
            barcode: row.barcode || null,
            description: row.description || null,
            is_active: true
          };

          // Insert product
          const { error } = await supabase
            .from('products')
            .insert([productData]);

          if (error) {
            errors.push(`Baris ${rowNumber}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Baris ${rowNumber}: Error tidak diketahui`);
        }
      }

      setImportResults({
        success: successCount,
        errors: errors
      });

      if (successCount > 0) {
        toast({
          title: 'Import berhasil',
          description: `${successCount} produk berhasil diimpor`,
        });
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membaca file Excel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Import Produk dari Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="space-y-2">
          <Label>1. Download Template Excel</Label>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>2. Pilih File Excel</Label>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>

        {/* Import Button */}
        <Button
          onClick={processExcelFile}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? 'Mengimpor...' : 'Import Produk'}
        </Button>

        {/* Import Results */}
        {importResults && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {importResults.success} produk berhasil diimpor
              </AlertDescription>
            </Alert>

            {importResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside text-sm">
                      {importResults.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {importResults.errors.length > 5 && (
                        <li>... dan {importResults.errors.length - 5} error lainnya</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">Petunjuk:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Download template Excel terlebih dahulu</li>
            <li>Isi data produk sesuai dengan format template</li>
            <li>Pastikan category_id dan unit_id valid (bisa dikosongkan)</li>
            <li>Nama produk dan harga jual wajib diisi</li>
            <li>Upload file Excel yang sudah diisi</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelImport;
