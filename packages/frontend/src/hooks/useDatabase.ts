import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as databaseApi from '../api/database.js';

/**
 * Every query key in the app is simultaneously stale after a reset (accounts,
 * transactions, investments, wealth, analytics, ...) — rather than fragile
 * precise-invalidation of every key, clear the whole cache and reload. Rare,
 * total action; a full reload is simpler and more robust than cache surgery,
 * and also clears any open form/filter state across every page for free.
 */
export function useResetDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => databaseApi.resetDatabase(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });
}
