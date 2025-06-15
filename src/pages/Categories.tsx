
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import CategoryForm from '@/components/CategoryForm';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Berhasil', description: 'Kategori berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-800" />
            <h1 className="text-3xl font-bold text-blue-800">Kategori Produk</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </DialogTitle>
              </DialogHeader>
              <CategoryForm 
                category={editingCategory} 
                onSuccess={handleDialogClose}
                onClose={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Kategori</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Belum ada kategori</p>
                        <p className="text-sm text-gray-500">Klik tombol "Tambah Kategori" untuk membuat kategori baru</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          {category.icon_url ? (
                            <img 
                              src={category.icon_url} 
                              alt={category.name} 
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {/* Product count would go here if needed */}
                            -
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Categories;
