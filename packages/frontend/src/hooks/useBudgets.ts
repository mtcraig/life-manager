import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBudgetInput, UpdateBudgetInput } from '@life-manager/shared';
import * as budgetsApi from '../api/budgets.js';

const BUDGETS_KEY = ['budgets'] as const;
const BUDGET_PROGRESS_KEY = (date: string) => ['budget-progress', date] as const;

export function useBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn: () => budgetsApi.fetchBudgets(),
  });
}

export function useBudgetProgress(date: string) {
  return useQuery({
    queryKey: BUDGET_PROGRESS_KEY(date),
    queryFn: () => budgetsApi.fetchBudgetProgress(date),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => budgetsApi.createBudget(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: ['budget-progress'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateBudgetInput }) => budgetsApi.updateBudget(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: ['budget-progress'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: ['budget-progress'] });
    },
  });
}
