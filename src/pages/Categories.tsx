import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import AccessControl from '@/components/layout/AccessControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Ruler, Plus, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CategoryForm from '@/components/CategoryForm';
import UnitForm from '@/components/UnitForm';
import BrandForm from '@/components/brands/BrandForm';
import CategoriesTable from '@/components/categories/CategoriesTable';
import UnitsTable from '@/components/units/UnitsTable';
import BrandsTable from '@/components/brands/BrandsTable';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

const Categories = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [unitPage, setUnitPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Categories query
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', categorySearchTerm, categoryPage],
    queryFn: async () => {
      const from = (categoryPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase.from('categories').select('*', { count: 'exact' });
      if (categorySearchTerm) query = query.ilike('name', `%${categorySearchTerm}%`);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
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
      let query = supabase.from('units').select('*', { count: 'exact' });
      if (unitSearchTerm) query = query.ilike('name', `%${unitSearchTerm}%`);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  // Brands query
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['brands', brandSearchTerm, brandPage],
    queryFn: async () => {
      const from = (brandPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase.from('product_brands').select('*', { count: 'exact' });
      if (brandSearchTerm) query = query.ilike('name', `%${brandSearchTerm}%`);
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
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

  const brands = brandsData?.data || [];
  const brandsCount = brandsData?.count || 0;
  const brandTotalPages = Math.ceil(brandsCount / ITEMS_PER_PAGE);

  // Delete mutations
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

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Berhasil', description: 'Brand berhasil dihapus' });
      setDeleteBrandId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteBrandId(null);
    }
  });

  const handleEditCategory = (category: any) => { setEditCategory(category); setCategoryDialogOpen(true); };
  const handleEditUnit = (unit: any) => { setEditUnit(unit); setUnitDialogOpen(true); };
  const handleEditBrand = (brand: any) => { setEditBrand(brand); setBrandDialogOpen(true); };
  const handleCategoryDialogClose = () => { setCategoryDialogOpen(false); setEditCategory(null); };
  const handleUnitDialogClose = () => { setUnitDialogOpen(false); setEditUnit(null); };
  const handleBrandDialogClose = () => { setBrandDialogOpen(false); setEditBrand(null); };

  const renderPagination = (page: number, totalPages: number, count: number, setPage: (fn: (p: number) => number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages} ({count} total)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Sebelumnya</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Selanjutnya</Button>
        </div>
      </div>
    );
  };

  const renderSearchHeader = (placeholder: string, value: string, onChange: (v: string) => void, resetPage: () => void, onAdd: () => void, addLabel: string) => (
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={placeholder} value={value} onChange={(e) => { onChange(e.target.value); resetPage(); }} className="pl-9" />
      </div>
      <Button onClick={onAdd} size="sm" className="sm:size-default">
        <Plus className="h-4 w-4 mr-2" />{addLabel}
      </Button>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories">
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-bold">Kategori, Unit & Brand</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="categories" className="flex items-center gap-1 text-xs sm:text-sm">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Kategori</span>
                <span className="sm:hidden">Kategori</span>
              </TabsTrigger>
              <TabsTrigger value="units" className="flex items-center gap-1 text-xs sm:text-sm">
                <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Unit</span>
              </TabsTrigger>
              <TabsTrigger value="brands" className="flex items-center gap-1 text-xs sm:text-sm">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Brand</span>
              </TabsTrigger>
            </TabsList>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-4 space-y-4">
              {renderSearchHeader('Cari kategori...', categorySearchTerm, setCategorySearchTerm, () => setCategoryPage(1), () => setCategoryDialogOpen(true), 'Tambah Kategori')}
              {categoriesLoading ? renderSkeleton() : <CategoriesTable categories={categories} onEdit={handleEditCategory} onDelete={setDeleteCategoryId} />}
              {renderPagination(categoryPage, categoryTotalPages, categoriesCount, setCategoryPage)}
            </TabsContent>

            {/* Units Tab */}
            <TabsContent value="units" className="mt-4 space-y-4">
              {renderSearchHeader('Cari unit...', unitSearchTerm, setUnitSearchTerm, () => setUnitPage(1), () => setUnitDialogOpen(true), 'Tambah Unit')}
              {unitsLoading ? renderSkeleton() : <UnitsTable units={units} onEdit={handleEditUnit} onDelete={setDeleteUnitId} />}
              {renderPagination(unitPage, unitTotalPages, unitsCount, setUnitPage)}
            </TabsContent>

            {/* Brands Tab */}
            <TabsContent value="brands" className="mt-4 space-y-4">
              {renderSearchHeader('Cari brand...', brandSearchTerm, setBrandSearchTerm, () => setBrandPage(1), () => setBrandDialogOpen(true), 'Tambah Brand')}
              {brandsLoading ? renderSkeleton() : <BrandsTable brands={brands} onEdit={handleEditBrand} onDelete={setDeleteBrandId} />}
              {renderPagination(brandPage, brandTotalPages, brandsCount, setBrandPage)}
            </TabsContent>
          </Tabs>
        </div>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={handleCategoryDialogClose}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle></DialogHeader>
            <CategoryForm category={editCategory} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['categories'] }); handleCategoryDialogClose(); }} onClose={handleCategoryDialogClose} />
          </DialogContent>
        </Dialog>

        {/* Unit Dialog */}
        <Dialog open={unitDialogOpen} onOpenChange={handleUnitDialogClose}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editUnit ? 'Edit Unit' : 'Tambah Unit'}</DialogTitle></DialogHeader>
            <UnitForm unit={editUnit} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['units'] }); handleUnitDialogClose(); }} onClose={handleUnitDialogClose} />
          </DialogContent>
        </Dialog>

        {/* Brand Dialog */}
        <Dialog open={brandDialogOpen} onOpenChange={handleBrandDialogClose}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editBrand ? 'Edit Brand' : 'Tambah Brand'}</DialogTitle></DialogHeader>
            <BrandForm brand={editBrand} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['brands'] }); handleBrandDialogClose(); }} onClose={handleBrandDialogClose} />
          </DialogContent>
        </Dialog>

        {/* Delete Category Alert */}
        <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
              <AlertDialogDescription>Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteCategoryId && deleteCategory.mutate(deleteCategoryId)}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Unit Alert */}
        <AlertDialog open={!!deleteUnitId} onOpenChange={() => setDeleteUnitId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Unit</AlertDialogTitle>
              <AlertDialogDescription>Apakah Anda yakin ingin menghapus unit ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteUnitId && deleteUnit.mutate(deleteUnitId)}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Brand Alert */}
        <AlertDialog open={!!deleteBrandId} onOpenChange={() => setDeleteBrandId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Brand</AlertDialogTitle>
              <AlertDialogDescription>Apakah Anda yakin ingin menghapus brand ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteBrandId && deleteBrand.mutate(deleteBrandId)}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </AccessControl>
  );
};

export default Categories;
