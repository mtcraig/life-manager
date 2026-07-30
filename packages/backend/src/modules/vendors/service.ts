import type { CreateVendorInput, VendorDto } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { VendorRow } from './repo';

function toDto(row: VendorRow): VendorDto {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listVendors(): VendorDto[] {
  return repo.listVendors().map(toDto);
}

export function createVendor(input: CreateVendorInput): VendorDto {
  try {
    const row = repo.insertVendor({ name: input.name });
    return toDto(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `A vendor named "${input.name}" already exists`);
    }
    throw error;
  }
}
