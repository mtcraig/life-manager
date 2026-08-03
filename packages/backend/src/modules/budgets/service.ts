import type { BudgetDto, BudgetProgressDto, CreateBudgetInput, UpdateBudgetInput } from '@life-manager/shared';
import { HttpError } from '../../lib/httpError';
import { computeBudgetProgress, getMonthRange, sumActualSpendByCategory } from '../../lib/calculations/budgets';
import * as categoriesRepo from '../categories/repo';
import * as transactionsRepo from '../transactions/repo';
import * as repo from './repo';
import type { BudgetRow } from './repo';

function toDto(row: BudgetRow): BudgetDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    amount: row.amount,
    startDate: row.startDate,
    endDate: row.endDate,
    notes: row.notes,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export function listBudgets(): BudgetDto[] {
  return repo.listBudgets().map(toDto);
}

export function getBudget(id: number): BudgetDto {
  const row = repo.getBudgetById(id);
  if (!row) {
    throw new HttpError(404, `Budget ${id} not found`);
  }
  return toDto(row);
}

export function createBudget(input: CreateBudgetInput): BudgetDto {
  const row = repo.insertBudget({
    categoryId: input.categoryId,
    amount: input.amount,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    notes: input.notes ?? null,
  });
  return toDto(row);
}

export function updateBudget(id: number, input: UpdateBudgetInput): BudgetDto {
  if (!repo.getBudgetById(id)) {
    throw new HttpError(404, `Budget ${id} not found`);
  }
  const row = repo.updateBudget(id, {
    ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    ...(input.amount !== undefined && { amount: input.amount }),
    ...(input.startDate !== undefined && { startDate: input.startDate }),
    ...(input.endDate !== undefined && { endDate: input.endDate ?? null }),
    ...(input.notes !== undefined && { notes: input.notes ?? null }),
  });
  return toDto(row as NonNullable<typeof row>);
}

export function deleteBudget(id: number): void {
  const deleted = repo.deleteBudget(id);
  if (!deleted) {
    throw new HttpError(404, `Budget ${id} not found`);
  }
}

/** Defaults to the calendar month containing today when no date is given. */
export function getBudgetProgress(dateIso?: string): BudgetProgressDto {
  const date = dateIso ?? new Date().toISOString().slice(0, 10);
  const { periodStart, periodEnd } = getMonthRange(date);

  const activeBudgets = repo.listBudgetsActiveDuring(periodStart, periodEnd);
  const rows = transactionsRepo.listCategorisedTransactionAmountsWithTransferFlag({
    dateFrom: periodStart,
    dateTo: periodEnd,
  });
  const actualsByCategory = sumActualSpendByCategory(rows);
  const categoryNames = new Map(categoriesRepo.listCategories().map((c) => [c.id, c.name]));

  const { items, totalBudgeted, totalActual } = computeBudgetProgress(activeBudgets, actualsByCategory, categoryNames);
  return { periodStart, periodEnd, items, totalBudgeted, totalActual };
}

/**
 * Cumulative budgeted-vs-actual for a year to date, one category-name row per
 * category. Reuses `getBudgetProgress` once per elapsed month rather than a
 * separate calculation, since it already correctly resolves which budget was
 * active for each individual month (a budget's amount can change partway
 * through the year) and that month's own actual spend — this just sums the
 * per-month results. Defaults to the current year, stopping at the current
 * month; a past year sums all 12 months.
 */
export function getAnnualBudgetProgress(year?: number): BudgetProgressDto {
  const today = new Date();
  const targetYear = year ?? today.getFullYear();
  const lastMonth = targetYear === today.getFullYear() ? today.getMonth() + 1 : 12;

  const itemsByCategory = new Map<number, { categoryName: string; budgeted: number; actual: number }>();
  let periodEnd = `${targetYear}-01-31`;

  for (let month = 1; month <= lastMonth; month++) {
    const monthDate = `${targetYear}-${String(month).padStart(2, '0')}-01`;
    const monthProgress = getBudgetProgress(monthDate);
    periodEnd = monthProgress.periodEnd;
    for (const item of monthProgress.items) {
      const existing = itemsByCategory.get(item.categoryId) ?? {
        categoryName: item.categoryName,
        budgeted: 0,
        actual: 0,
      };
      existing.budgeted += item.budgeted;
      existing.actual += item.actual;
      itemsByCategory.set(item.categoryId, existing);
    }
  }

  const items = [...itemsByCategory.entries()]
    .map(([categoryId, { categoryName, budgeted, actual }]) => ({
      categoryId,
      categoryName,
      budgeted,
      actual,
      delta: budgeted - actual,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  const totalBudgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0);

  return { periodStart: `${targetYear}-01-01`, periodEnd, items, totalBudgeted, totalActual };
}
