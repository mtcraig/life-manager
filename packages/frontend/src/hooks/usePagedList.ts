import { useState } from 'react';

const COLLAPSED_SIZE = 5;
const PAGE_SIZE = 25;

export function usePagedList<T>(items: T[] | undefined) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  const all = items ?? [];
  const total = all.length;

  function expand() {
    setExpanded(true);
    setPage(1);
  }

  function collapse() {
    setExpanded(false);
    setPage(1);
  }

  const visible = expanded
    ? all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : all.slice(0, COLLAPSED_SIZE);

  return {
    visible,
    total,
    expanded,
    expand,
    collapse,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    showShowMore: !expanded && total > COLLAPSED_SIZE,
    showPagination: expanded && total > PAGE_SIZE,
  };
}
