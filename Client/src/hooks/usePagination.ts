import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  initialItemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

export const usePagination = <T>({
  data,
  initialItemsPerPage = 10,
  initialPage = 1
}: UsePaginationProps<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Ensure current page is valid when data or itemsPerPage changes
  const validCurrentPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  // Update current page if it becomes invalid
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, validCurrentPage, itemsPerPage]);

  const handleSetCurrentPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const handleSetItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Adjust current page to maintain roughly the same position
    const currentFirstItem = (validCurrentPage - 1) * itemsPerPage + 1;
    const newPage = Math.ceil(currentFirstItem / newItemsPerPage);
    setCurrentPage(Math.max(1, newPage));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => handleSetCurrentPage(validCurrentPage + 1);
  const goToPreviousPage = () => handleSetCurrentPage(validCurrentPage - 1);

  return {
    currentPage: validCurrentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage: handleSetCurrentPage,
    setItemsPerPage: handleSetItemsPerPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage
  };
};