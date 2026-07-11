
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ITEMS_PER_PAGE = 10;

export const useOrdersData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Query for all orders for export
  const { data: allOrdersData } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, image_url, current_stock, min_stock)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, image_url, current_stock, min_stock)
          )
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  const orders = ordersData?.data || [];
  const ordersCount = ordersData?.count || 0;
  const totalPages = Math.ceil(ordersCount / ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return {
    orders,
    ordersCount,
    totalPages,
    currentPage,
    searchTerm,
    statusFilter,
    isLoading,
    allOrdersData,
    itemsPerPage: ITEMS_PER_PAGE,
    setCurrentPage,
    handleSearchChange,
    handleStatusChange
  };
};
