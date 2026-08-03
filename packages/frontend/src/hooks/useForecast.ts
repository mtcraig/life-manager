import { useQuery } from '@tanstack/react-query';
import type { ForecastQuery } from '@life-manager/shared';
import { fetchForecast } from '../api/forecast.js';

export function useForecast(query: Partial<ForecastQuery> = {}) {
  return useQuery({
    queryKey: ['forecast', query],
    queryFn: () => fetchForecast(query),
  });
}
