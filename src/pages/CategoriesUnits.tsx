
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Ruler, FolderOpen, Grid3X3 } from 'lucide-react';
import CategoriesTab from '@/components/categories/CategoriesTab';
import UnitsTab from '@/components/units/UnitsTab';

const CategoriesUnits = () => {
  const [activeTab, setActiveTab] = useState('categories');

  // Fetch categories count
  const { data: categoriesCount = 0 } = useQuery({
    queryKey: ['categories-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch units count
  const { data: unitsCount = 0 } = useQuery({
    queryKey: ['units-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch categories with icons
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-with-icons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Kategori & Unit</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
              <FolderOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{categoriesCount}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {categories.slice(0, 3).map((category) => (
                  <Badge key={category.id} variant="secondary" className="text-xs">
                    {category.icon_url && (
                      <img 
                        src={category.icon_url} 
                        alt={category.name}
                        className="w-3 h-3 mr-1"
                      />
                    )}
                    {category.name}
                  </Badge>
                ))}
                {categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{categories.length - 3} lainnya
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
              <Grid3X3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{unitsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Satuan untuk produk
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Kategori ({categoriesCount})
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Unit ({unitsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <UnitsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CategoriesUnits;
