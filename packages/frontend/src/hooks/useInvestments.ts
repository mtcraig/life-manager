import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateInvestmentInput, CreateValuationInput } from '@life-manager/shared';
import * as investmentsApi from '../api/investments.js';

const INVESTMENTS_KEY = ['investments'] as const;
const valuationsKey = (investmentId: number) => ['investment-valuations', investmentId] as const;

export function useInvestments(includeArchived = false) {
  return useQuery({
    queryKey: [...INVESTMENTS_KEY, { includeArchived }],
    queryFn: () => investmentsApi.fetchInvestments(includeArchived),
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvestmentInput) => investmentsApi.createInvestment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY }),
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateInvestmentInput> }) =>
      investmentsApi.updateInvestment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY }),
  });
}

export function useArchiveInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => investmentsApi.archiveInvestment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY }),
  });
}

export function useInvestmentValuations(investmentId: number | null) {
  return useQuery({
    queryKey: valuationsKey(investmentId ?? -1),
    queryFn: () => investmentsApi.fetchInvestmentValuations(investmentId as number),
    enabled: investmentId !== null,
  });
}

export function useAddInvestmentValuation(investmentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateValuationInput) =>
      investmentsApi.addInvestmentValuation(investmentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(investmentId) });
      queryClient.invalidateQueries({ queryKey: INVESTMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}
