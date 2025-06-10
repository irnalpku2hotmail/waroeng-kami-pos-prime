
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Ruler } from 'lucide-react';
import Layout from '@/components/Layout';

const Units = () => {
  const [open, setOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createUnit = useMutation({
    mutationFn: async (unit: any) => {
      const { error } = await supabase.from('units').insert([unit]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setOpen(false);
      toast({ title: 'Berhasil', description: 'Unit berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, ...unit }: any) => {
      const { error } = await supabase.from('units').update(unit).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setOpen(false);
      setEditUnit(null);
      toast({ title: 'Berhasil', description: 'Unit berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Berhasil', description: 'Unit berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const unitData = {
      name: formData.get('name') as string,
      abbreviation: formData.get('abbreviation') as string,
    };

    if (editUnit) {
      updateUnit.mutate({ id: editUnit.id, ...unitData });
    } else {
      createUnit.mutate(unitData);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Unit Produk</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditUnit(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editUnit ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Unit *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editUnit?.name}
                    placeholder="Contoh: Kilogram"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abbreviation">Singkatan *</Label>
                  <Input
                    id="abbreviation"
                    name="abbreviation"
                    defaultValue={editUnit?.abbreviation}
                    placeholder="Contoh: kg"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editUnit ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : units?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Ruler className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Belum ada unit</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units?.map((unit) => (
                <Card key={unit.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <p className="text-sm text-gray-600">Singkatan: {unit.abbreviation}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditUnit(unit);
                            setOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUnit.mutate(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Units;
