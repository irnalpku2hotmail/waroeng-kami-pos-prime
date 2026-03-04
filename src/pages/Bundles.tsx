
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BundleFormModal from '@/components/bundles/BundleFormModal';

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  bundle_type: string;
  status: string;
  discount_price: number;
  original_price: number;
  savings_amount: number;
  savings_percentage: number;
  created_at: string;
  bundle_items?: { id: string; product_id: string; quantity: number; products: { id: string; name: string; image_url: string | null; selling_price: number; current_stock: number } }[];
}

const Bundles = () => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select('*, bundle_items(*, products(id, name, image_url, selling_price, current_stock))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Bundle[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bundles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      toast({ title: 'Berhasil', description: 'Bundling berhasil dihapus' });
    },
  });

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-green-100 text-green-800';
    if (s === 'draft') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Paket Bundling</h1>
            <p className="text-sm text-gray-500">Kelola paket bundling produk</p>
          </div>
          <Button onClick={() => { setEditBundle(null); setFormOpen(true); }} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Buat Bundling
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : bundles.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-gray-500"><Package className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p>Belum ada paket bundling</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map(bundle => (
              <Card key={bundle.id} className="overflow-hidden">
                {bundle.image_url && (
                  <div className="aspect-video bg-gray-100">
                    <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base line-clamp-1">{bundle.name}</CardTitle>
                    <Badge className={statusColor(bundle.status)}>{bundle.status}</Badge>
                  </div>
                  {bundle.description && <p className="text-xs text-gray-500 line-clamp-2">{bundle.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{formatPrice(bundle.discount_price)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(bundle.original_price)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">Hemat {bundle.savings_percentage}%</Badge>
                    <span>{bundle.bundle_items?.length || 0} Produk</span>
                    <Badge variant="outline" className="text-xs capitalize">{bundle.bundle_type}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditBundle(bundle); setFormOpen(true); }}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(bundle.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BundleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        bundle={editBundle}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
          setFormOpen(false);
        }}
      />
    </Layout>
  );
};

export default Bundles;
