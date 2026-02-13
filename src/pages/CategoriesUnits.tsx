
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategorySearchList from '@/components/categories/CategorySearchList';
import UnitSearchList from '@/components/units/UnitSearchList';
import AccessControl from '@/components/layout/AccessControl';

const CategoriesUnits = () => {
  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories & Units">
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-xl md:text-3xl font-bold">Kategori & Unit</h1>

          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="categories" className="text-xs md:text-sm">Kategori</TabsTrigger>
              <TabsTrigger value="units" className="text-xs md:text-sm">Unit</TabsTrigger>
            </TabsList>

            <TabsContent value="categories">
              <CategorySearchList />
            </TabsContent>

            <TabsContent value="units">
              <UnitSearchList />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AccessControl>
  );
};

export default CategoriesUnits;
