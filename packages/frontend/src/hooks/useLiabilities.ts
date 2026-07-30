import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateLiabilityInput,
  CreateValuationInput,
  UpdateValuationInput,
} from '@life-manager/shared';
import * as liabilitiesApi from '../api/liabilities.js';

const LIABILITIES_KEY = ['liabilities'] as const;
const valuationsKey = (liabilityId: number) => ['liability-valuations', liabilityId] as const;

export function useLiabilities(includeArchived = false) {
  return useQuery({
    queryKey: [...LIABILITIES_KEY, { includeArchived }],
    queryFn: () => liabilitiesApi.fetchLiabilities(includeArchived),
  });
}

export function useCreateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLiabilityInput) => liabilitiesApi.createLiability(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY }),
  });
}

export function useUpdateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateLiabilityInput> }) =>
      liabilitiesApi.updateLiability(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY }),
  });
}

export function useArchiveLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => liabilitiesApi.archiveLiability(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY }),
  });
}

export function useDeleteLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => liabilitiesApi.deleteLiability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useLiabilityValuations(liabilityId: number | null) {
  return useQuery({
    queryKey: valuationsKey(liabilityId ?? -1),
    queryFn: () => liabilitiesApi.fetchLiabilityValuations(liabilityId as number),
    enabled: liabilityId !== null,
  });
}

export function useAddLiabilityValuation(liabilityId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateValuationInput) =>
      liabilitiesApi.addLiabilityValuation(liabilityId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(liabilityId) });
      queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useUpdateLiabilityValuation(liabilityId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valuationId, input }: { valuationId: number; input: UpdateValuationInput }) =>
      liabilitiesApi.updateLiabilityValuation(liabilityId, valuationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(liabilityId) });
      queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useDeleteLiabilityValuation(liabilityId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valuationId: number) => liabilitiesApi.deleteLiabilityValuation(liabilityId, valuationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(liabilityId) });
      queryClient.invalidateQueries({ queryKey: LIABILITIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}
