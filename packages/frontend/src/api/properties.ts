import type {
  CreatePropertyInput,
  CreateValuationInput,
  PropertyDto,
  UpdateValuationInput,
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

export function deleteProperty(id: number) {
  return apiFetch<void>(`/properties/${id}`, { method: 'DELETE' });
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

export function updatePropertyValuation(
  propertyId: number,
  valuationId: number,
  input: UpdateValuationInput,
) {
  return apiFetch<ValuationDto>(`/properties/${propertyId}/valuations/${valuationId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deletePropertyValuation(propertyId: number, valuationId: number) {
  return apiFetch<void>(`/properties/${propertyId}/valuations/${valuationId}`, { method: 'DELETE' });
}
