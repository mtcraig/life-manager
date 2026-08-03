import { z } from 'zod';

export interface BudgetDto {
  id: number;
  categoryId: number;
  amount: number;
  startDate: string;
  /** null means open-ended — the budget stays active until edited or deleted. */
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createBudgetSchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.number().int(),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().min(1).optional(),
});
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = createBudgetSchema.partial();
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export interface BudgetProgressItemDto {
  categoryId: number;
  categoryName: string;
  budgeted: number;
  actual: number;
  delta: number;
}

export interface BudgetProgressDto {
  periodStart: string;
  periodEnd: string;
  items: BudgetProgressItemDto[];
  totalBudgeted: number;
  totalActual: number;
}

export const budgetProgressQuerySchema = z.object({
  date: z.string().optional(),
});
export type BudgetProgressQuery = z.infer<typeof budgetProgressQuerySchema>;
