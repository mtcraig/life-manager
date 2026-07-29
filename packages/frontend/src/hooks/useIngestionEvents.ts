import { useQuery } from '@tanstack/react-query';
import { fetchIngestionEvents } from '../api/ingestionEvents.js';

export function useIngestionEvents() {
  return useQuery({
    queryKey: ['ingestion-events'],
    queryFn: fetchIngestionEvents,
    refetchInterval: 10_000,
  });
}
