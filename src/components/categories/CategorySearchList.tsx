
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Edit, Trash2, Plus } from 'lucide-react';
import CategoryModal from '../CategoryModal';

const CategorySearchList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['categories-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const handleSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Daftar Kategori
            </CardTitle>
            <CategoryModal onSuccess={handleSuccess} />
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {category.icon_url ? (
                          <img
                            src={category.icon_url}
                            alt={category.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {category.id.slice(0, 8)}...
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {new Date(category.created_at).toLocaleDateString('id-ID')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {category.products?.[0]?.count || 0} produk
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <CategoryModal
                          category={category}
                          onSuccess={handleSuccess}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Tidak ada kategori ditemukan' : 'Belum ada kategori'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `Tidak ada kategori yang cocok dengan "${searchTerm}"`
                    : 'Mulai dengan menambahkan kategori pertama Anda'
                  }
                </p>
                {!searchTerm && (
                  <CategoryModal onSuccess={handleSuccess} />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySearchList;
