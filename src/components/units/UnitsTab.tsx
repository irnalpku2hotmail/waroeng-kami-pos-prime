
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const UnitsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: units, isLoading } = useQuery({
    queryKey: ['units', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('units')
        .select(`
          *,
          products!inner(id)
        `);

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,abbreviation.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const saveUnit = useMutation({
    mutationFn: async (unitData: any) => {
      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitData)
          .eq('id', editingUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('units').insert(unitData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Berhasil',
        description: `Unit berhasil ${editingUnit ? 'diperbarui' : 'ditambahkan'}`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Gagal ${editingUnit ? 'memperbarui' : 'menambahkan'} unit`,
        variant: 'destructive',
      });
    },
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
      toast({
        title: 'Error',
        description: 'Gagal menghapus unit',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, abbreviation: unit.abbreviation });
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingUnit(null);
    setFormData({ name: '', abbreviation: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUnit.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      deleteUnit.mutate(id);
    }
  };

  const totalUnits = units?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Unit Satuan</h2>
          <p className="text-muted-foreground">
            Kelola unit satuan untuk produk Anda
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Unit</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">unit tersedia</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Unit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Cari unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : units && units.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Singkatan</TableHead>
                  <TableHead>Jumlah Produk</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.abbreviation}</TableCell>
                    <TableCell>{unit.products?.length || 0} produk</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(unit)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(unit.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada unit</h3>
              <p className="text-gray-600 mb-4">
                Mulai dengan menambahkan unit pertama Anda
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Unit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Edit Unit' : 'Tambah Unit Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Unit</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Kilogram"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Singkatan</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                placeholder="Contoh: kg"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Batal
              </Button>
              <Button type="submit" disabled={saveUnit.isPending}>
                {saveUnit.isPending ? 'Menyimpan...' : editingUnit ? 'Perbarui' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitsTab;
