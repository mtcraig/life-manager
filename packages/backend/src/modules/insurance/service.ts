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
    type: row.type,
    coverageAmount: row.coverageAmount,
    premiumAmount: row.premiumAmount,
    premiumFrequency: row.premiumFrequency as InsurancePlanDto['premiumFrequency'],
    renewalDate: row.renewalDate,
    provider: row.provider,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listInsurancePlans(): InsurancePlanDto[] {
  return repo.listInsurancePlans().map(toDto);
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
    coverageAmount: input.coverageAmount,
    premiumAmount: input.premiumAmount,
    premiumFrequency: input.premiumFrequency,
    renewalDate: input.renewalDate,
    provider: input.provider ?? null,
    notes: input.notes ?? null,
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
    ...(input.premiumAmount !== undefined && { premiumAmount: input.premiumAmount }),
    ...(input.premiumFrequency !== undefined && { premiumFrequency: input.premiumFrequency }),
    ...(input.renewalDate !== undefined && { renewalDate: input.renewalDate }),
    ...(input.provider !== undefined && { provider: input.provider ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteInsurancePlan(id: number): void {
  const deleted = repo.deleteInsurancePlan(id);
  if (!deleted) {
    throw new HttpError(404, `Insurance plan ${id} not found`);
  }
}
