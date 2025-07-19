
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Package } from 'lucide-react';
import Layout from '@/components/Layout';
import CategoriesTab from '@/components/categories/CategoriesTab';
import UnitsTab from '@/components/units/UnitsTab';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const CategoriesUnits = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['units', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('units')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['categories-units-stats'],
    queryFn: async () => {
      const [categoriesCount, unitsCount] = await Promise.all([
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('units').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalCategories: categoriesCount.count || 0,
        totalUnits: unitsCount.count || 0
      };
    }
  });

  const categories = categoriesData?.data || [];
  const categoriesCount = categoriesData?.count || 0;
  const units = unitsData?.data || [];
  const unitsCount = unitsData?.count || 0;
  const totalPages = Math.ceil(Math.max(categoriesCount, unitsCount) / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Kategori & Unit</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalCategories || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalUnits || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="units">Unit</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab 
              categories={categories}
              isLoading={categoriesLoading}
              searchTerm=""
            />
            {totalPages > 1 && (
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={categoriesCount}
              />
            )}
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <UnitsTab 
              units={units}
              isLoading={unitsLoading}
              searchTerm=""
            />
            {totalPages > 1 && (
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={unitsCount}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CategoriesUnits;
