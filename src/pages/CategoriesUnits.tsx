
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import CategoryForm from '@/components/CategoryForm';
import UnitsTab from '@/components/units/UnitsTab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';

const CategoriesUnits = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', searchTerm],
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCategorySuccess = () => {
    setCategoryOpen(false);
    setEditCategory(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Kategori & Unit</h1>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="units">Unit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kategori</h2>
              <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditCategory(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
                  </DialogHeader>
                  <CategoryForm 
                    category={editCategory}
                    onSuccess={handleCategorySuccess}
                    onClose={() => setCategoryOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Belum ada kategori</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icon</TableHead>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {category.icon_url ? (
                              <img 
                                src={category.icon_url} 
                                alt={category.name} 
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditCategory(category);
                                  setCategoryOpen(true);
                                }}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units">
            <UnitsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CategoriesUnits;
