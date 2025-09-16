import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Ruler } from 'lucide-react';

interface UnitFormProps {
  unit?: any;
  onSuccess?: () => void;
  onClose?: () => void;
}

const UnitForm = ({ unit, onSuccess, onClose }: UnitFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    abbreviation: unit?.abbreviation || '',
  });

  const createUnit = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('units')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Unit berhasil ditambahkan',
      });
      queryClient.invalidateQueries({ queryKey: ['units-list'] });
      onSuccess?.();
      setFormData({
        name: '',
        abbreviation: '',
      });
    },
    onError: (error: any) => {
      console.error('Error creating unit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan unit',
        variant: 'destructive',
      });
    },
  });

  const updateUnit = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('units')
        .update(data)
        .eq('id', unit.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Unit berhasil diperbarui',
      });
      queryClient.invalidateQueries({ queryKey: ['units-list'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error updating unit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui unit',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan singkatan unit wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      abbreviation: formData.abbreviation.trim().toUpperCase(),
    };

    if (unit) {
      updateUnit.mutate(submitData);
    } else {
      createUnit.mutate(submitData);
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
          <Ruler className="h-5 w-5" />
          {unit ? 'Edit Unit' : 'Tambah Unit Baru'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Unit *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Contoh: Kilogram"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">
              Singkatan *
            </Label>
            <Input
              id="abbreviation"
              value={formData.abbreviation}
              onChange={(e) => handleInputChange('abbreviation', e.target.value)}
              placeholder="Contoh: KG"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createUnit.isPending || updateUnit.isPending}
              className="flex-1"
            >
              {createUnit.isPending || updateUnit.isPending
                ? 'Menyimpan...'
                : unit
                ? 'Perbarui Unit'
                : 'Simpan Unit'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UnitForm;