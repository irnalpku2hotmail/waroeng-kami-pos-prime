import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Camera, ChevronDown, Loader2, Search, UserRound, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const CustomerScanner = lazy(() => import('./CustomerScanner'));

interface CustomerSelectorProps {
  customers: any[];
  selectedCustomer: any;
  setSelectedCustomer: (customer: any | null) => void;
}

const memberId = (id?: string) => (id ? `#${id.slice(0, 8).toUpperCase()}` : '');

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  const [open, setOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const term = debouncedSearch.trim();

  const { data: searchResults, isFetching, isError } = useQuery({
    queryKey: ['pos-customer-search', term],
    enabled: open && term.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const escaped = term.replace(/[%,()]/g, ' ').trim();
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, total_points')
        .or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%,email.ilike.%${escaped}%`)
        .order('name')
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });

  const list = useMemo(() => {
    if (term.length >= 2) return searchResults || [];
    return (customers || []).slice(0, 15);
  }, [term, searchResults, customers]);

  const handleSelect = (customer: any | null) => {
    setSelectedCustomer(customer);
    setOpen(false);
    setSearch('');
  };

  return (
    <div>
      <label className="text-sm font-medium">Customer (Opsional)</label>
      <div className="flex items-center gap-2 mt-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between font-normal min-w-0">
              <span className="flex items-center gap-2 min-w-0">
                <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {selectedCustomer ? `${selectedCustomer.name} — ${selectedCustomer.total_points ?? 0} pts` : 'Tanpa Customer'}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-2" align="start">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / nomor HP / member ID"
                className="pl-8 h-9"
              />
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto">
              <button
                type="button"
                className="w-full text-left px-2 py-2 text-sm rounded hover:bg-accent"
                onClick={() => handleSelect(null)}
              >
                Tanpa Customer
              </button>

              {term.length > 0 && term.length < 2 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  Ketik minimal 2 karakter untuk mencari.
                </p>
              )}

              {isFetching && (
                <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Mencari...
                </div>
              )}

              {isError && !isFetching && (
                <p className="px-2 py-3 text-xs text-destructive">Gagal memuat data customer. Coba lagi.</p>
              )}

              {!isFetching && !isError && term.length >= 2 && list.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">Customer tidak ditemukan.</p>
              )}

              {list.map((customer: any) => (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full text-left px-2 py-2 rounded hover:bg-accent"
                  onClick={() => handleSelect(customer)}
                >
                  <div className="text-sm font-medium truncate">{customer.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {customer.phone ? `${customer.phone} · ` : ''}Member {memberId(customer.id)} · {customer.total_points ?? 0} pts
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          title="Scan Customer"
          onClick={() => setScanOpen(true)}
        >
          <Camera className="h-4 w-4" />
        </Button>

        {selectedCustomer && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            title="Hapus customer"
            onClick={() => handleSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {scanOpen && (
        <Suspense fallback={null}>
          <CustomerScanner
            open={scanOpen}
            onOpenChange={setScanOpen}
            onCustomerFound={(customer) => setSelectedCustomer(customer)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default CustomerSelector;
