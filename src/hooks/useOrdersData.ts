import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_PAGE_SIZE, fetchOrders, ordersKey } from '@/lib/adminQueries';

export const useOrdersData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  // Server-side paginated list only. The full export dataset is fetched
  // on demand from the Export button (see Orders.tsx).
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ordersKey(debouncedSearch, statusFilter, currentPage, pageSize),
    queryFn: () => fetchOrders(debouncedSearch, statusFilter, currentPage, pageSize),
    placeholderData: keepPreviousData,
  });

  const orders = ordersData?.data || [];
  const ordersCount = ordersData?.count || 0;
  const totalPages = Math.ceil(ordersCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
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
    itemsPerPage: pageSize,
    pageSize,
    setCurrentPage,
    handleSearchChange,
    handleStatusChange,
    handlePageSizeChange
  };
};
