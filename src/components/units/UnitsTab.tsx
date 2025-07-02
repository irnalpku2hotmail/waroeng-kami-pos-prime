
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const UnitsTab = () => {
  const [open, setOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', searchTerm],
    queryFn: async () => {
      let query = supabase.from('units').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,abbreviation.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createUnit = useMutation({
    mutationFn: async (unit: any) => {
      // Check for duplicate name
      const { data: existing, error: checkError } = await supabase
        .from('units')
        .select('id')
        .eq('name', unit.name)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existing) throw new Error('Nama unit sudah ada');

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
      // Check for duplicate name (excluding current unit)
      const { data: existing, error: checkError } = await supabase
        .from('units')
        .select('id')
        .eq('name', unit.name)
        .neq('id', id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existing) throw new Error('Nama unit sudah ada');

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Unit</h2>
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

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama unit atau singkatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Unit</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : units.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada unit</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Singkatan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.abbreviation}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitsTab;
