
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any;
  onSuccess?: () => void;
}

const CustomerForm = ({ open, onOpenChange, customer, onSuccess }: CustomerFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    date_of_birth: customer?.date_of_birth || ''
  });

  // Generate customer code
  const generateCustomerCode = () => {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CUST-${timestamp.slice(-6)}${randomSuffix}`;
  };

  const createCustomer = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.name.trim()) {
        throw new Error('Nama customer harus diisi');
      }

      const customerData = {
        ...data,
        customer_code: generateCustomerCode(),
        total_points: 0,
        total_spent: 0
      };

      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);
        
        if (error) throw error;
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: customer ? 'Customer Updated' : 'Customer Created',
        description: customer 
          ? 'Customer berhasil diperbarui'
          : 'Customer baru berhasil ditambahkan'
      });
      
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onOpenChange(false);
      setFormData({ name: '', phone: '', email: '', address: '', date_of_birth: '' });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer ? 'Edit Customer' : 'Tambah Customer Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Nama Lengkap *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Nomor Telepon
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Contoh: 08123456789"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contoh@email.com"
            />
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Alamat
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Alamat lengkap customer"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Tanggal Lahir
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createCustomer.isPending}
              className="flex-1"
            >
              {createCustomer.isPending 
                ? 'Menyimpan...' 
                : customer 
                  ? 'Update Customer' 
                  : 'Tambah Customer'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;
