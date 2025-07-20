
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CategoryForm from '@/components/CategoryForm';
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react';

const CategoriesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select(`
          *,
          products!inner(id)
        `);

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Gagal menghapus kategori',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      deleteCategory.mutate(id);
    }
  };

  const totalCategories = categories?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Kategori Produk</h2>
          <p className="text-muted-foreground">
            Kelola kategori untuk mengorganisir produk Anda
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Kategori</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">kategori tersedia</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {category.icon_url ? (
                          <img 
                            src={category.icon_url} 
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-sm">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {category.products?.length || 0} produk
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada kategori</h3>
              <p className="text-gray-600 mb-4">
                Mulai dengan menambahkan kategori pertama Anda
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showAddForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleCloseForm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            handleCloseForm();
          }}
        />
      )}
    </div>
  );
};

export default CategoriesTab;
