
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface UnitsTabProps {
  units: any[];
  isLoading: boolean;
  searchTerm: string;
}

const UnitsTab = ({ units: externalUnits, isLoading: externalLoading, searchTerm: externalSearchTerm }: UnitsTabProps) => {
  const [open, setOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [unitData, setUnitData] = useState({
    name: '',
    abbreviation: ''
  });
  const queryClient = useQueryClient();

  // Use external data if provided, otherwise fetch our own
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', searchTerm],
    queryFn: async () => {
      let query = supabase.from('units').select('*');
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
    enabled: !externalUnits.length // Only fetch if external data is not provided
  });

  const finalUnits = externalUnits.length > 0 ? externalUnits : units;
  const finalLoading = externalUnits.length > 0 ? externalLoading : isLoading;

  const checkDuplicateName = async (name: string, excludeId?: string) => {
    const { data, error } = await supabase
      .from('units')
      .select('id')
      .ilike('name', name);
    
    if (error) throw error;
    
    if (excludeId) {
      return data.some(unit => unit.id !== excludeId);
    }
    
    return data.length > 0;
  };

  const saveUnit = useMutation({
    mutationFn: async (data: { name: string; abbreviation: string }) => {
      // Check for duplicate name
      const isDuplicate = await checkDuplicateName(data.name, editUnit?.id);
      if (isDuplicate) {
        throw new Error('Nama unit sudah ada, silakan gunakan nama lain');
      }

      if (editUnit) {
        const { error } = await supabase
          .from('units')
          .update(data)
          .eq('id', editUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('units')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ 
        title: 'Berhasil', 
        description: `Unit berhasil ${editUnit ? 'diperbarui' : 'ditambahkan'}` 
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
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
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (unit: any) => {
    setEditUnit(unit);
    setUnitData({
      name: String(unit.name || ''),
      abbreviation: String(unit.abbreviation || '')
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditUnit(null);
    setUnitData({
      name: '',
      abbreviation: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitData.name.trim() || !unitData.abbreviation.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Nama dan singkatan unit harus diisi', 
        variant: 'destructive' 
      });
      return;
    }
    saveUnit.mutate(unitData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
                <Label htmlFor="name">Nama Unit</Label>
                <Input
                  id="name"
                  value={unitData.name}
                  onChange={(e) => setUnitData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Kilogram"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abbreviation">Singkatan</Label>
                <Input
                  id="abbreviation"
                  value={unitData.abbreviation}
                  onChange={(e) => setUnitData(prev => ({ ...prev, abbreviation: e.target.value }))}
                  placeholder="kg"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saveUnit.isPending}>
                  {saveUnit.isPending ? 'Menyimpan...' : (editUnit ? 'Update' : 'Simpan')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        {finalLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : finalUnits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'Tidak ada unit yang ditemukan' : 'Belum ada unit'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Singkatan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{String(unit.name || '')}</TableCell>
                  <TableCell>{String(unit.abbreviation || '')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(unit)}
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
      </div>
    </div>
  );
};

export default UnitsTab;
