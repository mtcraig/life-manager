import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateInsurancePlanInput, UpdateInsurancePlanInput } from '@life-manager/shared';
import * as insuranceApi from '../api/insurance.js';

const INSURANCE_KEY = ['insurance-plans'] as const;

export function useInsurancePlans() {
  return useQuery({
    queryKey: INSURANCE_KEY,
    queryFn: () => insuranceApi.fetchInsurancePlans(),
  });
}

export function useCreateInsurancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInsurancePlanInput) => insuranceApi.createInsurancePlan(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function useUpdateInsurancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateInsurancePlanInput }) =>
      insuranceApi.updateInsurancePlan(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function useDeleteInsurancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => insuranceApi.deleteInsurancePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}

export function useCancelInsurancePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => insuranceApi.cancelInsurancePlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INSURANCE_KEY }),
  });
}
