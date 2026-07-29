import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateContentsItemInput, UpdateContentsItemInput } from '@life-manager/shared';
import * as contentsApi from '../api/contents.js';

const CONTENTS_KEY = ['contents-items'] as const;

export function useContentsItems() {
  return useQuery({
    queryKey: CONTENTS_KEY,
    queryFn: () => contentsApi.fetchContentsItems(),
  });
}

export function useCreateContentsItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContentsItemInput) => contentsApi.createContentsItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useUpdateContentsItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateContentsItemInput }) =>
      contentsApi.updateContentsItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useDeleteContentsItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contentsApi.deleteContentsItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}
