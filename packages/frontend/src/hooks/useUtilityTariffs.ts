import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUtilityTariffInput, UpdateUtilityTariffInput } from '@life-manager/shared';
import * as tariffsApi from '../api/utilityTariffs.js';

const TARIFFS_KEY = ['utility-tariffs'] as const;
const UTILITY_COST_KEY = ['energy-utility-costs'] as const;

export function useUtilityTariffs() {
  return useQuery({
    queryKey: TARIFFS_KEY,
    queryFn: () => tariffsApi.fetchUtilityTariffs(),
  });
}

export function useCreateUtilityTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUtilityTariffInput) => tariffsApi.createUtilityTariff(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}

export function useUpdateUtilityTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUtilityTariffInput }) =>
      tariffsApi.updateUtilityTariff(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}

export function useDeleteUtilityTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tariffsApi.deleteUtilityTariff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_KEY });
      queryClient.invalidateQueries({ queryKey: UTILITY_COST_KEY });
    },
  });
}
