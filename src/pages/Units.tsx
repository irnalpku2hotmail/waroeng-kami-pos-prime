import React from 'react';
import Layout from '@/components/Layout';
import UnitSearchList from '@/components/units/UnitSearchList';
import AccessControl from '@/components/layout/AccessControl';

const Units = () => {
  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Units">
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Unit Produk</h1>
          <UnitSearchList />
        </div>
      </Layout>
    </AccessControl>
  );
};

export default Units;
