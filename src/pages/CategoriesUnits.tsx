
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoriesTab from '@/components/categories/CategoriesTab';
import UnitsTab from '@/components/units/UnitsTab';
import Layout from '@/components/Layout';

const CategoriesUnits = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategori & Satuan</h1>
          <p className="text-muted-foreground">
            Kelola kategori produk dan satuan untuk sistem inventory Anda.
          </p>
        </div>

        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
            <TabsTrigger value="units">Satuan</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesTab />
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
