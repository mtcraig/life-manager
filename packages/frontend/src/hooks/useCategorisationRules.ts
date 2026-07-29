import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkImportRulesInput,
  CreateCategorisationRuleInput,
  UpdateCategorisationRuleInput,
} from '@life-manager/shared';
import * as rulesApi from '../api/categorisationRules.js';

const RULES_KEY = ['categorisation-rules'] as const;

export function useCategorisationRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: () => rulesApi.fetchCategorisationRules(),
  });
}

export function useCreateCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategorisationRuleInput) => rulesApi.createCategorisationRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCategorisationRuleInput }) =>
      rulesApi.updateCategorisationRule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rulesApi.deleteCategorisationRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useBulkImportCategorisationRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkImportRulesInput) => rulesApi.bulkImportCategorisationRules(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_KEY });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useRecategoriseUncategorised() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rulesApi.recategoriseUncategorised(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
