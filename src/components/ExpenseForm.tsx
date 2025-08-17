
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText } from 'lucide-react';

const expenseSchema = z.object({
  title: z.string().min(1, 'Judul pengeluaran wajib diisi'),
  category: z.enum(['operational', 'marketing', 'equipment', 'maintenance', 'other']),
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  expense_date: z.string().min(1, 'Tanggal pengeluaran wajib diisi'),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const ExpenseForm = ({ expense, onSuccess, onClose }: ExpenseFormProps) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>(expense?.receipt_url || '');
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || '',
      category: expense?.category || 'operational',
      amount: expense?.amount || 0,
      expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
      description: expense?.description || '',
    }
  });

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'File harus berupa gambar atau PDF',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Ukuran file maksimal 5MB',
          variant: 'destructive'
        });
        return;
      }

      setReceiptFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(''); // For PDF files, no preview
      }
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview('');
  };

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createExpense = useMutation({
    mutationFn: async (data: ExpenseFormData & { receipt_url?: string }) => {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...data,
          user_id: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateExpense = useMutation({
    mutationFn: async (data: ExpenseFormData & { receipt_url?: string }) => {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Berhasil', description: 'Pengeluaran berhasil diperbarui' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setUploading(true);
      let receipt_url = receiptPreview;

      if (receiptFile) {
        receipt_url = await uploadReceipt(receiptFile);
      }

      const formData = { 
        ...data, 
        receipt_url: receipt_url || undefined
      };

      if (expense) {
        updateExpense.mutate(formData);
      } else {
        createExpense.mutate(formData);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const categoryOptions = [
    { value: 'operational', label: 'Operasional' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'equipment', label: 'Peralatan' },
    { value: 'maintenance', label: 'Perawatan' },
    { value: 'other', label: 'Lainnya' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul Pengeluaran</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Masukkan judul pengeluaran"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <Select 
          value={watch('category')} 
          onValueChange={(value: any) => setValue('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Jumlah (Rp)</Label>
          <Input
            id="amount"
            type="number"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_date">Tanggal</Label>
          <Input
            id="expense_date"
            type="date"
            {...register('expense_date')}
          />
          {errors.expense_date && (
            <p className="text-sm text-red-500">{errors.expense_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Masukkan deskripsi (opsional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Struk/Kwitansi</Label>
        <div className="flex items-center gap-4">
          {receiptPreview ? (
            <div className="relative">
              {receiptPreview.startsWith('data:image') || receiptPreview.includes('image') ? (
                <img 
                  src={receiptPreview} 
                  alt="Receipt preview" 
                  className="w-20 h-20 object-cover rounded border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <button
                type="button"
                onClick={removeReceipt}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleReceiptChange}
              className="hidden"
              id="receipt-upload"
            />
            <Label htmlFor="receipt-upload" className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Struk
                </span>
              </Button>
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Format: JPG, PNG, PDF (Max: 5MB)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={uploading || createExpense.isPending || updateExpense.isPending}
        >
          {uploading ? 'Mengupload...' : expense ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default ExpenseForm;
