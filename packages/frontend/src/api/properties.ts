import type {
  CreatePropertyInput,
  CreateValuationInput,
  PropertyDto,
  ValuationDto,
} from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchProperties(includeArchived = false) {
  return apiFetch<PropertyDto[]>(`/properties?includeArchived=${includeArchived}`);
}

export function createProperty(input: CreatePropertyInput) {
  return apiFetch<PropertyDto>('/properties', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProperty(id: number, input: Partial<CreatePropertyInput>) {
  return apiFetch<PropertyDto>(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function archiveProperty(id: number) {
  return apiFetch<PropertyDto>(`/properties/${id}/archive`, { method: 'POST' });
}

export function fetchPropertyValuations(propertyId: number) {
  return apiFetch<ValuationDto[]>(`/properties/${propertyId}/valuations`);
}

export function addPropertyValuation(propertyId: number, input: CreateValuationInput) {
  return apiFetch<ValuationDto>(`/properties/${propertyId}/valuations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
