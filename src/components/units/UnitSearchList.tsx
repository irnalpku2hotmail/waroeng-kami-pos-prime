
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Ruler, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import UnitModal from '../UnitModal';

const UnitSearchList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units-list', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('units')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 0
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Unit berhasil dihapus',
      });
      queryClient.invalidateQueries({ queryKey: ['units-list'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus unit',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      deleteUnit.mutate(id);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['units-list'] });
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
              <Ruler className="h-5 w-5" />
              Daftar Unit
            </CardTitle>
            <UnitModal onSuccess={handleSuccess} />
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {units.length > 0 ? (
              units.map((unit) => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Ruler className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{unit.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {unit.abbreviation}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {unit.id.slice(0, 8)}...
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {new Date(unit.created_at).toLocaleDateString('id-ID')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <UnitModal
                          unit={unit}
                          onSuccess={handleSuccess}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(unit.id)}
                          disabled={deleteUnit.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Tidak ada unit ditemukan' : 'Belum ada unit'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `Tidak ada unit yang cocok dengan "${searchTerm}"`
                    : 'Mulai dengan menambahkan unit pertama Anda'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitSearchList;
