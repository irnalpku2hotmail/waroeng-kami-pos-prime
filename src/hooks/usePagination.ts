
import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  paginatedIndices: { from: number; to: number };
}

export const usePagination = ({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1
}: UsePaginationProps): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const canNextPage = currentPage < totalPages;
  const canPrevPage = currentPage > 1;

  const nextPage = () => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (canPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginatedIndices = useMemo(() => ({
    from: startIndex,
    to: endIndex - 1
  }), [startIndex, endIndex]);

  // Reset to page 1 if totalItems changes and current page is out of bounds
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    setCurrentPage,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
    paginatedIndices
  };
};
