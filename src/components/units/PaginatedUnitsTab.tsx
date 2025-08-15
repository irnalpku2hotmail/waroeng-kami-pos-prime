
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const PaginatedUnitsTab = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [newUnit, setNewUnit] = useState({
    name: '',
    abbreviation: ''
  });

  const queryClient = useQueryClient();

  // Fetch units with pagination
  const { data: unitsData, isLoading } = useQuery({
    queryKey: ['units-paginated', currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('units')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        units: data || [],
        total: count || 0
      };
    }
  });

  const totalPages = Math.ceil((unitsData?.total || 0) / ITEMS_PER_PAGE);

  // Create unit mutation
  const createUnit = useMutation({
    mutationFn: async (unit: { name: string; abbreviation: string }) => {
      const { error } = await supabase
        .from('units')
        .insert(unit);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-paginated'] });
      toast({ title: 'Berhasil', description: 'Unit berhasil dibuat' });
      setIsCreateDialogOpen(false);
      setNewUnit({ name: '', abbreviation: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update unit mutation
  const updateUnit = useMutation({
    mutationFn: async (unit: { id: string; name: string; abbreviation: string }) => {
      const { error } = await supabase
        .from('units')
        .update({ name: unit.name, abbreviation: unit.abbreviation })
        .eq('id', unit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-paginated'] });
      toast({ title: 'Berhasil', description: 'Unit berhasil diupdate' });
      setIsEditDialogOpen(false);
      setEditingUnit(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete unit mutation
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-paginated'] });
      toast({ title: 'Berhasil', description: 'Unit berhasil dihapus' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateUnit = () => {
    if (!newUnit.name.trim() || !newUnit.abbreviation.trim()) {
      toast({ title: 'Error', description: 'Nama dan singkatan unit harus diisi', variant: 'destructive' });
      return;
    }
    createUnit.mutate(newUnit);
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit?.name?.trim() || !editingUnit?.abbreviation?.trim()) {
      toast({ title: 'Error', description: 'Nama dan singkatan unit harus diisi', variant: 'destructive' });
      return;
    }
    updateUnit.mutate(editingUnit);
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      deleteUnit.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Unit
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Unit Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi unit baru
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Unit</Label>
                  <Input
                    id="name"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama unit"
                  />
                </div>
                <div>
                  <Label htmlFor="abbreviation">Singkatan</Label>
                  <Input
                    id="abbreviation"
                    value={newUnit.abbreviation}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, abbreviation: e.target.value }))}
                    placeholder="Masukkan singkatan unit"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateUnit} disabled={createUnit.isPending}>
                  {createUnit.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Singkatan</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsData?.units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.abbreviation}</TableCell>
                    <TableCell>
                      {new Date(unit.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUnit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={unitsData?.total || 0}
              />
            )}
          </>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Unit</DialogTitle>
              <DialogDescription>
                Ubah informasi unit
              </DialogDescription>
            </DialogHeader>
            {editingUnit && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nama Unit</Label>
                  <Input
                    id="edit-name"
                    value={editingUnit.name}
                    onChange={(e) => setEditingUnit(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-abbreviation">Singkatan</Label>
                  <Input
                    id="edit-abbreviation"
                    value={editingUnit.abbreviation}
                    onChange={(e) => setEditingUnit(prev => ({ ...prev, abbreviation: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdateUnit} disabled={updateUnit.isPending}>
                {updateUnit.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PaginatedUnitsTab;
