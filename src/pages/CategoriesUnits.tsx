
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryList from '@/components/categories/CategoryList';
import UnitList from '@/components/units/UnitList';
import AccessControl from '@/components/layout/AccessControl';

const CategoriesUnits = () => {
  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories & Units">
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Kategori & Unit</h1>

          <Tabs defaultValue="categories" className="w-full">
            <TabsList>
              <TabsTrigger value="categories">Kategori</TabsTrigger>
              <TabsTrigger value="units">Unit</TabsTrigger>
            </TabsList>

            <TabsContent value="categories">
              <CategoryList />
            </TabsContent>

            <TabsContent value="units">
              <UnitList />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AccessControl>
  );
};

export default CategoriesUnits;
