import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface CategoriesTabProps {
  categories?: any[];
  isLoading?: boolean;
  searchTerm?: string;
}

const CategoriesTab = ({ categories: externalCategories = [], isLoading: externalLoading = false, searchTerm: externalSearchTerm = '' }: CategoriesTabProps) => {
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [categoryData, setCategoryData] = useState({
    name: '',
    description: '',
    icon_url: ''
  });
  const queryClient = useQueryClient();

  // Use external data if provided, otherwise fetch our own
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', searchTerm],
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
    enabled: externalCategories.length === 0 // Only fetch if external data is not provided
  });

  const finalCategories = externalCategories.length > 0 ? externalCategories : categories;
  const finalLoading = externalCategories.length > 0 ? externalLoading : isLoading;

  const checkDuplicateName = async (name: string, excludeId?: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name);
    
    if (error) throw error;
    
    if (excludeId) {
      return data.some(category => category.id !== excludeId);
    }
    
    return data.length > 0;
  };

  const saveCategory = useMutation({
    mutationFn: async (data: { name: string; description: string; icon_url: string }) => {
      // Check for duplicate name
      const isDuplicate = await checkDuplicateName(data.name, editCategory?.id);
      if (isDuplicate) {
        throw new Error('Nama kategori sudah ada, silakan gunakan nama lain');
      }

      if (editCategory) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editCategory.id);
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
        description: `Kategori berhasil ${editCategory ? 'diperbarui' : 'ditambahkan'}` 
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Berhasil', description: 'Kategori berhasil dihapus' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (category: any) => {
    setEditCategory(category);
    setCategoryData({
      name: String(category.name || ''),
      description: String(category.description || ''),
      icon_url: String(category.icon_url || '')
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditCategory(null);
    setCategoryData({
      name: '',
      description: '',
      icon_url: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryData.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Nama kategori harus diisi', 
        variant: 'destructive' 
      });
      return;
    }
    saveCategory.mutate(categoryData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={categoryData.name}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Makanan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={categoryData.description}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi kategori..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon_url">URL Icon</Label>
                <Input
                  id="icon_url"
                  value={categoryData.icon_url}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, icon_url: e.target.value }))}
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saveCategory.isPending}>
                  {saveCategory.isPending ? 'Menyimpan...' : (editCategory ? 'Update' : 'Simpan')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        {finalLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : finalCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'Tidak ada kategori yang ditemukan' : 'Belum ada kategori'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{String(category.name || '')}</TableCell>
                  <TableCell>{String(category.description || '')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCategory.mutate(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;
