import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePropertyInput, CreateValuationInput, UpdateValuationInput } from '@life-manager/shared';
import * as propertiesApi from '../api/properties.js';

const PROPERTIES_KEY = ['properties'] as const;
const valuationsKey = (propertyId: number) => ['property-valuations', propertyId] as const;

export function useProperties(includeArchived = false) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, { includeArchived }],
    queryFn: () => propertiesApi.fetchProperties(includeArchived),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => propertiesApi.createProperty(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreatePropertyInput> }) =>
      propertiesApi.updateProperty(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY }),
  });
}

export function useArchiveProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => propertiesApi.archiveProperty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => propertiesApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function usePropertyValuations(propertyId: number | null) {
  return useQuery({
    queryKey: valuationsKey(propertyId ?? -1),
    queryFn: () => propertiesApi.fetchPropertyValuations(propertyId as number),
    enabled: propertyId !== null,
  });
}

export function useAddPropertyValuation(propertyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateValuationInput) =>
      propertiesApi.addPropertyValuation(propertyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(propertyId) });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useUpdatePropertyValuation(propertyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valuationId, input }: { valuationId: number; input: UpdateValuationInput }) =>
      propertiesApi.updatePropertyValuation(propertyId, valuationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(propertyId) });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}

export function useDeletePropertyValuation(propertyId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valuationId: number) => propertiesApi.deletePropertyValuation(propertyId, valuationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuationsKey(propertyId) });
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['wealth'] });
    },
  });
}
