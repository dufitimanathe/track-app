'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/store';
import type { PaginatedResult } from '@/lib/api/client';

export function useCompanyId(): string {
  return useAppSelector((s) => s.auth.companyId);
}

export function usePaginatedResource<T>(
  loader: (companyId: string, page: number, search: string) => Promise<PaginatedResult<T>>,
  deps: unknown[] = [],
) {
  const companyId = useCompanyId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loader(companyId, page, search);
      setItems(result.items);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, page, search, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    companyId,
    items,
    page,
    setPage,
    search,
    setSearch,
    total,
    totalPages,
    loading,
    error,
    reload,
  };
}
