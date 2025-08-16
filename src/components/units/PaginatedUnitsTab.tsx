
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PaginationComponent from '../PaginationComponent';
import { usePagination } from '@/hooks/usePagination';

const PaginatedUnitsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '' });
  const queryClient = useQueryClient();

  const { data: allUnits = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Filter units based on search
  const filteredUnits = allUnits.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    setCurrentPage
  } = usePagination({
    totalItems: filteredUnits.length,
    itemsPerPage: 12
  });

  const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

  const saveUnit = useMutation({
    mutationFn: async (unitData: any) => {
      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitData)
          .eq('id', editingUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('units')
          .insert(unitData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: `Unit berhasil ${editingUnit ? 'diperbarui' : 'ditambahkan'}` });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      handleCloseForm();
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
    mutationFn: async (unitId: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Unit berhasil dihapus' });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, abbreviation: unit.abbreviation });
    setShowForm(true);
  };

  const handleDelete = (unitId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      deleteUnit.mutate(unitId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUnit(null);
    setFormData({ name: '', abbreviation: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan singkatan unit harus diisi',
        variant: 'destructive'
      });
      return;
    }
    saveUnit.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari unit..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Unit
        </Button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedUnits.map((unit) => (
          <Card key={unit.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium truncate">
                  {unit.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(unit.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {unit.abbreviation}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  ID: {unit.id.slice(0, 8)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {paginatedUnits.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? 'Tidak ada unit yang sesuai dengan pencarian' : 'Belum ada unit'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredUnits.length > 12 && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredUnits.length}
          itemsPerPage={12}
        />
      )}

      {/* Unit Form Modal */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Edit Unit' : 'Tambah Unit Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Unit</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Kilogram"
                required
              />
            </div>
            <div>
              <Label htmlFor="abbreviation">Singkatan</Label>
              <Input
                id="abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData(prev => ({ ...prev, abbreviation: e.target.value }))}
                placeholder="Contoh: kg"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Batal
              </Button>
              <Button type="submit" disabled={saveUnit.isPending}>
                {saveUnit.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaginatedUnitsTab;
