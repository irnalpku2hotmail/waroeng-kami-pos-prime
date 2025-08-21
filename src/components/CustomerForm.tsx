
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface CustomerFormProps {
  customer?: any;
  onSuccess?: () => void;
}

const CustomerForm = ({ customer, onSuccess }: CustomerFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    date_of_birth: customer?.date_of_birth || '',
  });

  const createCustomer = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('customers')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Customer berhasil ditambahkan',
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        date_of_birth: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan customer',
        variant: 'destructive',
      });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', customer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Customer berhasil diperbarui',
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui customer',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama customer wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      date_of_birth: formData.date_of_birth || null,
    };

    if (customer) {
      updateCustomer.mutate(submitData);
    } else {
      createCustomer.mutate(submitData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {customer ? 'Edit Customer' : 'Tambah Customer Baru'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Nama Lengkap *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Masukkan alamat email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Tanggal Lahir
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Alamat
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Masukkan alamat lengkap"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createCustomer.isPending || updateCustomer.isPending}
              className="flex-1"
            >
              {createCustomer.isPending || updateCustomer.isPending
                ? 'Menyimpan...'
                : customer
                ? 'Perbarui Customer'
                : 'Simpan Customer'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
