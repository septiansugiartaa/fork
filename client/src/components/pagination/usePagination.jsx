import { useState, useEffect } from "react";

export default function usePagination(data, itemsPerPage) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman 1 jika data berubah (misal saat search)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Logic Potong Data
  const maxPage = Math.ceil(data.length / itemsPerPage);
  
  const currentData = () => {
    const begin = (currentPage - 1) * itemsPerPage;
    const end = begin + itemsPerPage;
    return data.slice(begin, end);
  };

  // Handlers
  const next = () => {
    setCurrentPage((currentPage) => Math.min(currentPage + 1, maxPage));
  };

  const prev = () => {
    setCurrentPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  const jump = (page) => {
    const pageNumber = Math.max(1, page);
    setCurrentPage(Math.min(pageNumber, maxPage));
  };

  return { 
    next, 
    prev, 
    jump, 
    currentData: currentData(), 
    currentPage, 
    maxPage 
  };
}