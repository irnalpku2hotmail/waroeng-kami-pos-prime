import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import AccessControl from '@/components/layout/AccessControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Ruler, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CategoryForm from '@/components/CategoryForm';
import UnitForm from '@/components/UnitForm';
import CategoriesTable from '@/components/categories/CategoriesTable';
import UnitsTable from '@/components/units/UnitsTable';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

const Categories = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [unitPage, setUnitPage] = useState(1);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Categories query
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', categorySearchTerm, categoryPage],
    queryFn: async () => {
      const from = (categoryPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' });

      if (categorySearchTerm) {
        query = query.ilike('name', `%${categorySearchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  // Units query
  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', unitSearchTerm, unitPage],
    queryFn: async () => {
      const from = (unitPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('units')
        .select('*', { count: 'exact' });

      if (unitSearchTerm) {
        query = query.ilike('name', `%${unitSearchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  const categories = categoriesData?.data || [];
  const categoriesCount = categoriesData?.count || 0;
  const categoryTotalPages = Math.ceil(categoriesCount / ITEMS_PER_PAGE);

  const units = unitsData?.data || [];
  const unitsCount = unitsData?.count || 0;
  const unitTotalPages = Math.ceil(unitsCount / ITEMS_PER_PAGE);

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Berhasil', description: 'Kategori berhasil dihapus' });
      setDeleteCategoryId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteCategoryId(null);
    }
  });

  // Delete unit mutation
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Berhasil', description: 'Unit berhasil dihapus' });
      setDeleteUnitId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteUnitId(null);
    }
  });

  const handleEditCategory = (category: any) => {
    setEditCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleEditUnit = (unit: any) => {
    setEditUnit(unit);
    setUnitDialogOpen(true);
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialogOpen(false);
    setEditCategory(null);
  };

  const handleUnitDialogClose = () => {
    setUnitDialogOpen(false);
    setEditUnit(null);
  };

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories">
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Kategori & Unit</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Kategori
              </TabsTrigger>
              <TabsTrigger value="units" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Unit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="mt-6 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kategori..."
                    value={categorySearchTerm}
                    onChange={(e) => {
                      setCategorySearchTerm(e.target.value);
                      setCategoryPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setCategoryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kategori
                </Button>
              </div>

              {/* Table */}
              {categoriesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <CategoriesTable
                  categories={categories}
                  onEdit={handleEditCategory}
                  onDelete={setDeleteCategoryId}
                />
              )}

              {/* Pagination */}
              {categoryTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Halaman {categoryPage} dari {categoryTotalPages} ({categoriesCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryPage(p => Math.max(1, p - 1))}
                      disabled={categoryPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoryPage(p => Math.min(categoryTotalPages, p + 1))}
                      disabled={categoryPage === categoryTotalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="units" className="mt-6 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari unit..."
                    value={unitSearchTerm}
                    onChange={(e) => {
                      setUnitSearchTerm(e.target.value);
                      setUnitPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setUnitDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Unit
                </Button>
              </div>

              {/* Table */}
              {unitsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <UnitsTable
                  units={units}
                  onEdit={handleEditUnit}
                  onDelete={setDeleteUnitId}
                />
              )}

              {/* Pagination */}
              {unitTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Halaman {unitPage} dari {unitTotalPages} ({unitsCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnitPage(p => Math.max(1, p - 1))}
                      disabled={unitPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnitPage(p => Math.min(unitTotalPages, p + 1))}
                      disabled={unitPage === unitTotalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={handleCategoryDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editCategory}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                handleCategoryDialogClose();
              }}
              onClose={handleCategoryDialogClose}
            />
          </DialogContent>
        </Dialog>

        {/* Unit Dialog */}
        <Dialog open={unitDialogOpen} onOpenChange={handleUnitDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUnit ? 'Edit Unit' : 'Tambah Unit'}</DialogTitle>
            </DialogHeader>
            <UnitForm
              unit={editUnit}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['units'] });
                handleUnitDialogClose();
              }}
              onClose={handleUnitDialogClose}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Category Alert */}
        <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteCategoryId && deleteCategory.mutate(deleteCategoryId)}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Unit Alert */}
        <AlertDialog open={!!deleteUnitId} onOpenChange={() => setDeleteUnitId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Unit</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus unit ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteUnitId && deleteUnit.mutate(deleteUnitId)}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </AccessControl>
  );
};

export default Categories;
