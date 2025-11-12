import React from 'react';
import Layout from '@/components/Layout';
import CategorySearchList from '@/components/categories/CategorySearchList';
import UnitSearchList from '@/components/units/UnitSearchList';
import AccessControl from '@/components/layout/AccessControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Ruler } from 'lucide-react';

const Categories = () => {
  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories">
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Kategori & Unit</h1>
          
          <Tabs defaultValue="categories" className="w-full">
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
            
            <TabsContent value="categories" className="mt-6">
              <CategorySearchList />
            </TabsContent>
            
            <TabsContent value="units" className="mt-6">
              <UnitSearchList />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AccessControl>
  );
};

export default Categories;
