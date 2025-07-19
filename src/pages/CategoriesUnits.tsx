
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CategoriesTab from '@/components/categories/CategoriesTab';
import UnitsTab from '@/components/units/UnitsTab';

const CategoriesUnits = () => {
  return (
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
  );
};

export default CategoriesUnits;
