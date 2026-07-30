import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateVendorInput } from '@life-manager/shared';
import * as vendorsApi from '../api/vendors.js';

const VENDORS_KEY = ['vendors'] as const;

export function useVendors() {
  return useQuery({
    queryKey: VENDORS_KEY,
    queryFn: () => vendorsApi.fetchVendors(),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVendorInput) => vendorsApi.createVendor(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VENDORS_KEY }),
  });
}
