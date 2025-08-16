
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import PaginatedCategoriesTab from '@/components/categories/PaginatedCategoriesTab';
import PaginatedUnitsTab from '@/components/units/PaginatedUnitsTab';
import { FolderTree, Package } from 'lucide-react';

const CategoriesUnits = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FolderTree className="h-8 w-8 text-blue-800" />
          <h1 className="text-3xl font-bold text-blue-800">Kategori & Unit</h1>
        </div>

        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Kategori
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Unit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <PaginatedCategoriesTab />
          </TabsContent>

          <TabsContent value="units">
            <PaginatedUnitsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CategoriesUnits;
