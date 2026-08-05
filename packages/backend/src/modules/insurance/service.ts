import type {
  CreateInsurancePlanInput,
  InsurancePlanDto,
  UpdateInsurancePlanInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { InsurancePlanRow } from './repo';

function toDto(row: InsurancePlanRow): InsurancePlanDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type as InsurancePlanDto['type'],
    coverageAmount: row.coverageAmount,
    excessAmount: row.excessAmount,
    premiumAmount: row.premiumAmount,
    premiumFrequency: row.premiumFrequency as InsurancePlanDto['premiumFrequency'],
    effectiveDate: row.effectiveDate,
    renewalDate: row.renewalDate,
    provider: row.provider,
    notes: row.notes,
    policyNumber: row.policyNumber,
    vehicleRegistration: row.vehicleRegistration,
    postcode: row.postcode,
    cancelledAt: row.cancelledAt === null ? null : new Date(row.cancelledAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

/**
 * There's no scheduler in this app, so "auto-cancel once past renewal" is
 * reconciled lazily here on every read rather than by a background job —
 * a plan only flips to Cancelled the next time the Insurance page is loaded.
 */
export function listInsurancePlans(): InsurancePlanDto[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows = repo.listInsurancePlans();
  const reconciled = rows.map((row) => {
    if (row.cancelledAt === null && row.renewalDate < today) {
      return repo.cancelInsurancePlan(row.id) ?? row;
    }
    return row;
  });
  return reconciled.map(toDto);
}

export function getInsurancePlan(id: number): InsurancePlanDto {
  const row = repo.getInsurancePlanById(id);
  if (!row) {
    throw new HttpError(404, `Insurance plan ${id} not found`);
  }
  return toDto(row);
}

export function createInsurancePlan(input: CreateInsurancePlanInput): InsurancePlanDto {
  const row = repo.insertInsurancePlan({
    name: input.name,
    type: input.type,
    coverageAmount: input.coverageAmount ?? null,
    excessAmount: input.excessAmount ?? null,
    premiumAmount: input.premiumAmount,
    premiumFrequency: input.premiumFrequency,
    effectiveDate: input.effectiveDate,
    renewalDate: input.renewalDate,
    provider: input.provider ?? null,
    notes: input.notes ?? null,
    policyNumber: input.policyNumber ?? null,
    vehicleRegistration: input.vehicleRegistration ?? null,
    postcode: input.postcode ?? null,
  });
  return toDto(row);
}

export function updateInsurancePlan(id: number, input: UpdateInsurancePlanInput): InsurancePlanDto {
  if (!repo.getInsurancePlanById(id)) {
    throw new HttpError(404, `Insurance plan ${id} not found`);
  }
  const row = repo.updateInsurancePlan(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.coverageAmount !== undefined && { coverageAmount: input.coverageAmount }),
    ...(input.excessAmount !== undefined && { excessAmount: input.excessAmount }),
    ...(input.premiumAmount !== undefined && { premiumAmount: input.premiumAmount }),
    ...(input.premiumFrequency !== undefined && { premiumFrequency: input.premiumFrequency }),
    ...(input.effectiveDate !== undefined && { effectiveDate: input.effectiveDate }),
    ...(input.renewalDate !== undefined && { renewalDate: input.renewalDate }),
    ...(input.provider !== undefined && { provider: input.provider ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
    ...(input.policyNumber !== undefined && { policyNumber: input.policyNumber ?? null }),
    ...(input.vehicleRegistration !== undefined && { vehicleRegistration: input.vehicleRegistration ?? null }),
    ...(input.postcode !== undefined && { postcode: input.postcode ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteInsurancePlan(id: number): void {
  const deleted = repo.deleteInsurancePlan(id);
  if (!deleted) {
    throw new HttpError(404, `Insurance plan ${id} not found`);
  }
}

export function cancelInsurancePlan(id: number): InsurancePlanDto {
  const row = repo.cancelInsurancePlan(id);
  if (!row) {
    throw new HttpError(404, `Insurance plan ${id} not found`);
  }
  return toDto(row);
}
