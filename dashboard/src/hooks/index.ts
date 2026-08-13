import { useState, useMemo } from 'react';

export function useSearch<T>(data: T[] | undefined, searchKey: keyof T) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      return String(val || "").toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchKey, searchTerm]);

  return { searchTerm, setSearchTerm, filteredData };
}

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle };
}
