
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Ruler } from 'lucide-react';
import Layout from '@/components/Layout';
import CategoryForm from '@/components/CategoryForm';

const ITEMS_PER_PAGE = 10;

const CategoriesUnits = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [unitsPage, setUnitsPage] = useState(1);
  const queryClient = useQueryClient();

  // Categories queries and mutations
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', searchTerm, categoriesPage],
    queryFn: async () => {
      const from = (categoriesPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase.from('categories').select(`
        *,
        products(count)
      `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('name', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  // Units queries and mutations
  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', unitsPage],
    queryFn: async () => {
      const from = (unitsPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('units')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const categories = categoriesData?.data || [];
  const categoriesCount = categoriesData?.count || 0;
  const totalCategoriesPages = Math.ceil(categoriesCount / ITEMS_PER_PAGE);

  const units = unitsData?.data || [];
  const unitsCount = unitsData?.count || 0;
  const totalUnitsPages = Math.ceil(unitsCount / ITEMS_PER_PAGE);

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

  const createUnit = useMutation({
    mutationFn: async (unit: any) => {
      const { error } = await supabase.from('units').insert([unit]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setUnitOpen(false);
      toast({ title: 'Berhasil', description: 'Unit berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...unit }: any) => {
      const { error } = await supabase.from('units').update(unit).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setUnitOpen(false);
      setEditUnit(null);
      toast({ title: 'Berhasil', description: 'Unit berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCategoryCloseDialog = () => {
    setCategoryOpen(false);
    setEditCategory(null);
  };

  const handleUnitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const unitData = {
      name: formData.get('name') as string,
      abbreviation: formData.get('abbreviation') as string,
    };

    if (editUnit) {
      updateUnit.mutate({ id: editUnit.id, ...unitData });
    } else {
      createUnit.mutate(unitData);
    }
  };

  const getIconUrl = (iconUrl: string | null | undefined) => {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('http')) return iconUrl;
    
    const { data } = supabase.storage
      .from('category-icons')
      .getPublicUrl(iconUrl);
    
    return data.publicUrl;
  };

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) onPageChange(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
            
            {getVisiblePages().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(page as number);
                    }}
                    isActive={currentPage === page}
                    className="hover:bg-accent"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) onPageChange(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Categories & Units</h1>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Input
                  placeholder="Cari kategori..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCategoriesPage(1);
                  }}
                  className="max-w-sm"
                />
              </div>
              <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditCategory(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
                  </DialogHeader>
                  <CategoryForm 
                    category={editCategory}
                    onSuccess={handleCategoryCloseDialog}
                    onClose={handleCategoryCloseDialog}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {categoriesLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada kategori</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icon</TableHead>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {category.icon_url ? (
                              <img 
                                src={getIconUrl(category.icon_url)} 
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
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {category.products?.[0]?.count || 0} produk
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(category.created_at).toLocaleDateString('id-ID')}
                          </TableCell>
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
                  {renderPagination(categoriesPage, totalCategoriesPages, setCategoriesPage)}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <div className="flex items-center justify-between">
              <div></div>
              <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditUnit(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Unit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editUnit ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUnitSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Unit *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editUnit?.name}
                        placeholder="Contoh: Kilogram"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abbreviation">Singkatan *</Label>
                      <Input
                        id="abbreviation"
                        name="abbreviation"
                        defaultValue={editUnit?.abbreviation}
                        placeholder="Contoh: kg"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setUnitOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit">
                        {editUnit ? 'Update' : 'Simpan'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {unitsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : units.length === 0 ? (
                <div className="text-center py-8">
                  <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada unit</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Unit</TableHead>
                        <TableHead>Singkatan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>{unit.abbreviation}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditUnit(unit);
                                  setUnitOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUnit.mutate(unit.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination(unitsPage, totalUnitsPages, setUnitsPage)}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CategoriesUnits;
