import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '@life-manager/shared';
import * as subscriptionsApi from '../api/subscriptions.js';

const SUBSCRIPTIONS_KEY = ['subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({
    queryKey: SUBSCRIPTIONS_KEY,
    queryFn: () => subscriptionsApi.fetchSubscriptions(),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => subscriptionsApi.createSubscription(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateSubscriptionInput }) =>
      subscriptionsApi.updateSubscription(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subscriptionsApi.deleteSubscription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subscriptionsApi.cancelSubscription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY }),
  });
}
