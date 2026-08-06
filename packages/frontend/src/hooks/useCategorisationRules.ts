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

/** ['transactions'] is invalidated once the returned jobId's recategorise job
 * completes (see CategorisationRulesSettings' useJob wiring), not here — the
 * rule itself is created immediately, but reapplying it to existing
 * transactions runs as an async, progress-tracked background job. */
export function useCreateCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategorisationRuleInput) => rulesApi.createCategorisationRule(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useUpdateCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCategorisationRuleInput }) =>
      rulesApi.updateCategorisationRule(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useDeleteCategorisationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rulesApi.deleteCategorisationRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useDeleteAllCategorisationRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rulesApi.deleteAllCategorisationRules(),
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
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

/** Also job-based — see the comment on useCreateCategorisationRule. */
export function useRecategoriseUncategorised() {
  return useMutation({
    mutationFn: () => rulesApi.recategoriseUncategorised(),
  });
}

/** The broad, slower re-evaluation — see reapplyAllRules in the backend service. */
export function useReapplyAllRules() {
  return useMutation({
    mutationFn: () => rulesApi.reapplyAllRules(),
  });
}
