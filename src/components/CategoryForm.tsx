
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CategoryFormProps {
  category?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoryForm = ({ category, open, onOpenChange }: CategoryFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon_url: category.icon_url || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon_url: ''
      });
    }
  }, [category, open]);

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (category) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Berhasil',
        description: category ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan'
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      await saveCategoryMutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Kategori *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Masukkan nama kategori"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Masukkan deskripsi kategori"
            />
          </div>
          
          <div>
            <Label htmlFor="icon_url">URL Icon</Label>
            <Input
              id="icon_url"
              value={formData.icon_url}
              onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
              placeholder="https://example.com/icon.png"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Menyimpan...' : category ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
