
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Package, Ruler } from 'lucide-react';
import CategoriesTab from '@/components/categories/CategoriesTab';
import UnitsTab from '@/components/units/UnitsTab';

const CategoriesUnits = () => {
  const [activeTab, setActiveTab] = useState('categories');

  // Fetch categories count
  const { data: categoriesCount } = useQuery({
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
  const { data: unitsCount } = useQuery({
    queryKey: ['units-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kategori & Unit</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesCount}</div>
              <p className="text-xs text-muted-foreground">
                kategori produk tersedia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unit</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unitsCount}</div>
              <p className="text-xs text-muted-foreground">
                unit pengukuran tersedia
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Kategori
              <Badge variant="secondary">{categoriesCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Unit
              <Badge variant="secondary">{unitsCount}</Badge>
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
