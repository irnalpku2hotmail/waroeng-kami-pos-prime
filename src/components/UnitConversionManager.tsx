
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUnitConversions, useAllUnits } from '@/hooks/useUnitConversions';
import { Trash2, Plus } from 'lucide-react';

interface UnitConversionManagerProps {
  productId: string;
  productName: string;
}

const UnitConversionManager = ({ productId, productName }: UnitConversionManagerProps) => {
  const queryClient = useQueryClient();
  const { data: conversions = [] } = useUnitConversions(productId);
  const { data: units = [] } = useAllUnits();
  
  const [newConversion, setNewConversion] = useState({
    from_unit_id: '',
    to_unit_id: '',
    conversion_factor: 1
  });

  const addConversion = useMutation({
    mutationFn: async (conversionData: any) => {
      const { error } = await supabase
        .from('unit_conversions')
        .insert({
          product_id: productId,
          ...conversionData
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversions'] });
      setNewConversion({ from_unit_id: '', to_unit_id: '', conversion_factor: 1 });
      toast({ title: 'Konversi unit berhasil ditambahkan' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteConversion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unit_conversions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversions'] });
      toast({ title: 'Konversi unit berhasil dihapus' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konversi Unit - {productName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <Label>Dari Unit</Label>
            <Select
              value={newConversion.from_unit_id}
              onValueChange={(value) => setNewConversion(prev => ({ ...prev, from_unit_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ke Unit</Label>
            <Select
              value={newConversion.to_unit_id}
              onValueChange={(value) => setNewConversion(prev => ({ ...prev, to_unit_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Faktor Konversi</Label>
            <Input
              type="number"
              step="0.01"
              value={newConversion.conversion_factor}
              onChange={(e) => setNewConversion(prev => ({ ...prev, conversion_factor: Number(e.target.value) }))}
              placeholder="1"
            />
          </div>
          <Button 
            onClick={() => addConversion.mutate(newConversion)}
            disabled={!newConversion.from_unit_id || !newConversion.to_unit_id}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>

        {conversions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dari Unit</TableHead>
                <TableHead>Ke Unit</TableHead>
                <TableHead>Faktor Konversi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell>
                    {conversion.from_unit?.name} ({conversion.from_unit?.abbreviation})
                  </TableCell>
                  <TableCell>
                    {conversion.to_unit?.name} ({conversion.to_unit?.abbreviation})
                  </TableCell>
                  <TableCell>{conversion.conversion_factor}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteConversion.mutate(conversion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitConversionManager;
