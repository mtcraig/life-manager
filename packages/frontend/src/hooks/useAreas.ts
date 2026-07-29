import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAreaInput } from '@life-manager/shared';
import * as areasApi from '../api/areas.js';

const AREAS_KEY = ['areas'] as const;

export function useAreas() {
  return useQuery({
    queryKey: AREAS_KEY,
    queryFn: () => areasApi.fetchAreas(),
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAreaInput) => areasApi.createArea(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AREAS_KEY }),
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => areasApi.deleteArea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AREAS_KEY }),
  });
}
