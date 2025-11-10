import React from 'react';
import Layout from '@/components/Layout';
import CategorySearchList from '@/components/categories/CategorySearchList';
import AccessControl from '@/components/layout/AccessControl';

const Categories = () => {
  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Categories">
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Kategori Produk</h1>
          <CategorySearchList />
        </div>
      </Layout>
    </AccessControl>
  );
};

export default Categories;
