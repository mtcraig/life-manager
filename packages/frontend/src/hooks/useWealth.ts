import { useQuery } from '@tanstack/react-query';
import * as wealthApi from '../api/wealth.js';

export function useWealthSummary() {
  return useQuery({
    queryKey: ['wealth'],
    queryFn: () => wealthApi.fetchWealthSummary(),
  });
}

export function useNetWorthTrend() {
  return useQuery({
    queryKey: ['wealth', 'trend'],
    queryFn: () => wealthApi.fetchNetWorthTrend(),
  });
}
