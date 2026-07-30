import type { CreateVendorInput, VendorDto } from '@life-manager/shared';
import { apiFetch } from './client.js';

export function fetchVendors() {
  return apiFetch<VendorDto[]>('/vendors');
}

export function createVendor(input: CreateVendorInput) {
  return apiFetch<VendorDto>('/vendors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
