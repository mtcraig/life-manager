import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateEnergyReadingInput } from '@life-manager/shared';
import * as energyApi from '../api/energy.js';

const ENERGY_KEY = ['energy-readings'] as const;
const UTILITY_COST_KEY = ['energy-utility-costs'] as const;

export function useEnergyReadings() {
  return useQuery({
    queryKey: ENERGY_KEY,
    queryFn: () => energyApi.fetchEnergyReadings(),
  });
}

export function useUtilityCostSeries(year: number | undefined) {
  return useQuery({
    queryKey: [...UTILITY_COST_KEY, year ?? 'all'],
    queryFn: () => energyApi.fetchUtilityCostSeries({ year }),
  });
}

export function useCreateEnergyReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEnergyReadingInput) => energyApi.createEnergyReading(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENERGY_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}

export function useBulkImportEnergyReadings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (csvContent: string) => energyApi.bulkImportEnergyReadings(csvContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENERGY_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}

export function useDeleteEnergyReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => energyApi.deleteEnergyReading(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENERGY_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}
