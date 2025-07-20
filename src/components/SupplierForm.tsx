
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SupplierFormProps {
  supplier?: any;
  onSuccess: () => void;
  onClose: () => void;
}

const SupplierForm = ({ supplier, onSuccess, onClose }: SupplierFormProps) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    notes: supplier?.notes || ''
  });

  const queryClient = useQueryClient();

  const createSupplier = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('suppliers').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Berhasil', description: 'Supplier berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateSupplier = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('suppliers')
        .update(data)
        .eq('id', supplier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Berhasil', description: 'Supplier berhasil diupdate' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Nama supplier harus diisi', variant: 'destructive' });
      return;
    }

    if (supplier) {
      updateSupplier.mutate(formData);
    } else {
      createSupplier.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Supplier *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Masukkan nama supplier"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_person">Kontak Person</Label>
        <Input
          id="contact_person"
          name="contact_person"
          value={formData.contact_person}
          onChange={handleChange}
          placeholder="Masukkan nama kontak person"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telepon</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Masukkan nomor telepon"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Masukkan email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Masukkan alamat lengkap"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Masukkan catatan tambahan"
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={createSupplier.isPending || updateSupplier.isPending}
        >
          {createSupplier.isPending || updateSupplier.isPending 
            ? 'Menyimpan...' 
            : (supplier ? 'Update' : 'Simpan')
          }
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
