import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCategoryInput } from '@life-manager/shared';
import * as categoriesApi from '../api/categories.js';

const CATEGORIES_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => categoriesApi.fetchCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.createCategory(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}
