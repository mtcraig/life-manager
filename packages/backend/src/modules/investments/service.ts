import type {
  CreateInvestmentInput,
  CreateValuationInput,
  InvestmentDto,
  ValuationDto,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import * as repo from './repo';
import type { InvestmentRow, ValuationRow } from './repo';

function toDto(row: InvestmentRow, currentValue: number | null): InvestmentDto {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    notes: row.notes,
    archivedAt: row.archivedAt ? new Date(row.archivedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    currentValue,
  };
}

function valuationToDto(row: ValuationRow): ValuationDto {
  return {
    id: row.id,
    entityId: row.investmentId,
    asOfDate: row.asOfDate,
    value: row.value,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export function listInvestments(includeArchived: boolean): InvestmentDto[] {
  const rows = repo.listInvestments(includeArchived);
  const latestValues = repo.listLatestValuationsForAll();
  return rows.map((row) => toDto(row, latestValues.get(row.id) ?? null));
}

export function getInvestment(id: number): InvestmentDto {
  const row = repo.getInvestmentById(id);
  if (!row) {
    throw new HttpError(404, `Investment ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export function createInvestment(input: CreateInvestmentInput): InvestmentDto {
  const row = repo.insertInvestment({
    name: input.name,
    kind: input.kind ?? null,
    notes: input.notes ?? null,
  });
  return toDto(row, null);
}

export function updateInvestment(id: number, input: Partial<CreateInvestmentInput>): InvestmentDto {
  if (!repo.getInvestmentById(id)) {
    throw new HttpError(404, `Investment ${id} not found`);
  }
  const row = repo.updateInvestment(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.kind !== undefined && { kind: input.kind ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row as NonNullable<typeof row>, latestValues.get(id) ?? null);
}

export function archiveInvestment(id: number): InvestmentDto {
  const row = repo.archiveInvestment(id);
  if (!row) {
    throw new HttpError(404, `Investment ${id} not found`);
  }
  const latestValues = repo.listLatestValuationsForAll();
  return toDto(row, latestValues.get(id) ?? null);
}

export function listValuations(investmentId: number): ValuationDto[] {
  if (!repo.getInvestmentById(investmentId)) {
    throw new HttpError(404, `Investment ${investmentId} not found`);
  }
  return repo.listValuations(investmentId).map(valuationToDto);
}

export function addValuation(investmentId: number, input: CreateValuationInput): ValuationDto {
  if (!repo.getInvestmentById(investmentId)) {
    throw new HttpError(404, `Investment ${investmentId} not found`);
  }
  try {
    const row = repo.insertValuation(investmentId, {
      asOfDate: input.asOfDate,
      value: input.value,
      notes: input.notes ?? null,
    });
    return valuationToDto(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new HttpError(409, `A valuation for ${input.asOfDate} already exists`);
    }
    throw error;
  }
}
