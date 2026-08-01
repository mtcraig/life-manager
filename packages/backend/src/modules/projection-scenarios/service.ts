import type {
  CreateProjectionScenarioInput,
  ProjectionResultDto,
  ProjectionScenarioDto,
  UpdateProjectionScenarioInput,
} from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { monthsBetween, projectFutureValue } from '../../lib/calculations/projection';
import * as investmentsRepo from '../investments/repo';
import * as repo from './repo';
import type { ProjectionScenarioRow } from './repo';

function toDto(row: ProjectionScenarioRow): ProjectionScenarioDto {
  return {
    id: row.id,
    name: row.name,
    growthRatePct: row.growthRatePct,
    monthlyContribution: row.monthlyContribution,
    retirementAge: row.retirementAge,
    retirementDate: row.retirementDate,
    comments: row.comments,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function currentTotalInvestmentValue(): number {
  let total = 0;
  for (const value of investmentsRepo.listLatestValuationsForAll().values()) {
    total += value;
  }
  return total;
}

export function listScenarios(): ProjectionScenarioDto[] {
  return repo.listScenarios().map(toDto);
}

export function getScenario(id: number): ProjectionScenarioDto {
  const row = repo.getScenarioById(id);
  if (!row) {
    throw new HttpError(404, `Projection scenario ${id} not found`);
  }
  return toDto(row);
}

export function createScenario(input: CreateProjectionScenarioInput): ProjectionScenarioDto {
  const row = repo.insertScenario({
    name: input.name,
    growthRatePct: input.growthRatePct,
    monthlyContribution: input.monthlyContribution,
    retirementAge: input.retirementAge ?? null,
    retirementDate: input.retirementDate ?? null,
    comments: input.comments ?? null,
  });
  return toDto(row);
}

export function updateScenario(
  id: number,
  input: UpdateProjectionScenarioInput,
): ProjectionScenarioDto {
  if (!repo.getScenarioById(id)) {
    throw new HttpError(404, `Projection scenario ${id} not found`);
  }
  const row = repo.updateScenario(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.growthRatePct !== undefined && { growthRatePct: input.growthRatePct }),
    ...(input.monthlyContribution !== undefined && {
      monthlyContribution: input.monthlyContribution,
    }),
    ...(input.retirementAge !== undefined && { retirementAge: input.retirementAge ?? null }),
    ...(input.retirementDate !== undefined && { retirementDate: input.retirementDate ?? null }),
    ...(input.comments !== undefined && { comments: input.comments ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteScenario(id: number): void {
  const deleted = repo.deleteScenario(id);
  if (!deleted) {
    throw new HttpError(404, `Projection scenario ${id} not found`);
  }
}

/**
 * Projects the current total investment value forward to the scenario's
 * retirementDate. retirementAge is stored for the user's own reference only —
 * there's no birthdate field in the domain model to convert an age into a
 * target date, so only retirementDate (an explicit absolute date) drives the
 * actual math.
 */
export function computeProjection(id: number): ProjectionResultDto {
  const row = repo.getScenarioById(id);
  if (!row) {
    throw new HttpError(404, `Projection scenario ${id} not found`);
  }
  if (!row.retirementDate) {
    return { projectedValue: null, months: null };
  }

  const today = new Date().toISOString().slice(0, 10);
  const months = monthsBetween(today, row.retirementDate);
  const projectedValue = projectFutureValue({
    currentValue: currentTotalInvestmentValue(),
    monthlyContribution: row.monthlyContribution,
    growthRatePct: row.growthRatePct,
    months,
  });

  return { projectedValue: Math.round(projectedValue), months };
}
